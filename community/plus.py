"""Opt-in Stripe Checkout licensing. Disabled until live configuration is supplied.
No client-supplied paid flags, donor links or browser redirects grant a license.
"""
import base64, contextlib, hashlib, hmac, json, os, re, secrets, sqlite3, time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode, urlsplit
from urllib.error import URLError

PLANS = {'single': {'usd': 500, 'devices': 1}, 'family': {'usd': 1000, 'devices': 5}}
# Fixed launch window, decided by server time. Existing licenses stay lifetime.
OFFER_START = 1793046384  # 2026-10-26 20:26:24 UTC
OFFER_END = 1795724784    # 2026-11-26 20:26:24 UTC
ANNUAL_SECONDS = 365 * 24 * 60 * 60
GRANT_PLANS = dict(PLANS, owner={'devices': None})
FREE = ['islamic-makkah', 'islamic-madinah', 'islamic-quds', 'ac-milan-legends', 'gta6', 'blue-cinema', 'blue', 'night', 'emerald', 'violet', 'ahly', 'zamalek', 'ismaily', 'saudi-national', 'egypt-national', 'madrid', 'barcelona']

class Plus:
    def __init__(self, data, secret, origin):
        self.path, self.secret, self.origin = Path(data)/'plus.sqlite3', secret, origin
        with self.db() as db:
            db.executescript('''
             PRAGMA journal_mode=WAL;
             CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY, proof TEXT NOT NULL, plan TEXT NOT NULL, license_hash TEXT UNIQUE,
              session TEXT UNIQUE, payment TEXT UNIQUE, paid INTEGER NOT NULL DEFAULT 0, revoked INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL);
             CREATE TABLE IF NOT EXISTS devices(license TEXT NOT NULL, device TEXT NOT NULL, name TEXT NOT NULL,
              token TEXT UNIQUE NOT NULL, created INTEGER NOT NULL, PRIMARY KEY(license,device));
             CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY, created INTEGER NOT NULL);
             CREATE TABLE IF NOT EXISTS studios(token TEXT PRIMARY KEY, license TEXT NOT NULL, device TEXT NOT NULL,
              created INTEGER NOT NULL, UNIQUE(license,device));
             CREATE TABLE IF NOT EXISTS rate(key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires INTEGER NOT NULL);
             CREATE TABLE IF NOT EXISTS grants(email TEXT PRIMARY KEY, license TEXT UNIQUE NOT NULL REFERENCES orders(id),
              name TEXT NOT NULL DEFAULT '', created INTEGER NOT NULL, updated INTEGER NOT NULL);
             CREATE TABLE IF NOT EXISTS grant_audit(id INTEGER PRIMARY KEY, license TEXT NOT NULL, action TEXT NOT NULL,
              actor TEXT NOT NULL, created INTEGER NOT NULL);
             CREATE TABLE IF NOT EXISTS short_codes(hash TEXT PRIMARY KEY, license TEXT UNIQUE NOT NULL REFERENCES orders(id));
            ''')
            if 'source' not in [r['name'] for r in db.execute('PRAGMA table_info(orders)')]:
                db.execute("ALTER TABLE orders ADD COLUMN source TEXT NOT NULL DEFAULT 'stripe'")
            if 'mode' not in [r['name'] for r in db.execute('PRAGMA table_info(orders)')]:
                db.execute("ALTER TABLE orders ADD COLUMN mode TEXT NOT NULL DEFAULT 'live'")
            columns = [r['name'] for r in db.execute('PRAGMA table_info(orders)')]
            if 'entitlement' not in columns:
                db.execute("ALTER TABLE orders ADD COLUMN entitlement TEXT NOT NULL DEFAULT 'lifetime'")
            if 'expires' not in columns:
                db.execute("ALTER TABLE orders ADD COLUMN expires INTEGER")
            for row in db.execute('SELECT id FROM orders').fetchall():
                self.register_short(db,row['id'])
        os.chmod(self.path, 0o600)

    @contextlib.contextmanager
    def db(self):
        db=sqlite3.connect(self.path, timeout=10);db.row_factory=sqlite3.Row
        try:
            with db:yield db
        finally:db.close()

    def digest(self, value):
        return hmac.new(self.secret, value.encode(), hashlib.sha256).hexdigest()

    def code(self, order):
        return 'MORPH-'+base64.b32encode(hmac.new(self.secret, ('license:'+order).encode(), hashlib.sha256).digest()[:20]).decode().rstrip('=')

    def short_code(self, order):
        return 'MT-'+base64.b32encode(hmac.new(self.secret, ('license-short:'+order).encode(), hashlib.sha256).digest()).decode()[:12]

    def client_origin_allowed(self, origin, path):
        if origin in ['', 'null', self.origin]:return True
        value=urlsplit(origin)
        if value.scheme=='http' and value.hostname in ['localhost','127.0.0.1'] and not value.username and not value.password:return True
        # Packaged TV runtimes serialize file origins differently. Only the
        # code/token authenticated client endpoints accept these app origins.
        if path not in ['/api/plus/activate','/api/plus/studio','/api/plus/status','/api/plus/devices','/api/plus/remove-device']:return False
        if value.username or value.password or value.query or value.fragment:return False
        if value.scheme=='file' and value.netloc in ['', 'localhost', 'com.zainbot.morphtv.preview']:return True
        return origin in ['app://com.zainbot.morphtv.preview','http://com.zainbot.morphtv.preview']

    def register_short(self, db, order):
        code=self.short_code(order);hashed=self.digest(code)
        db.execute('INSERT OR IGNORE INTO short_codes(hash,license) VALUES (?,?)',(hashed,order))
        if db.execute('SELECT license FROM short_codes WHERE hash=?',(hashed,)).fetchone()['license']!=order:
            raise ValueError('short_code_collision')
        return code

    def enabled(self):
        mode=os.environ.get('MORPH_PLUS_MODE','test')
        key=os.environ.get('MORPH_STRIPE_SECRET','')
        prefix=('sk_live_','rk_live_') if mode=='live' else ('sk_test_','rk_test_')
        return mode in ['test','live'] and key.startswith(prefix) and os.environ.get('MORPH_PLUS_ENABLED')=='true' and all(os.environ.get(x) for x in ['MORPH_STRIPE_SECRET','MORPH_STRIPE_WEBHOOK_SECRET','MORPH_STRIPE_SINGLE_PRICE','MORPH_STRIPE_FAMILY_PRICE'])

    def stripe(self, path, values=None, key=None):
        headers={'Authorization':'Bearer '+os.environ['MORPH_STRIPE_SECRET'],'Stripe-Version':'2025-06-30.basil'}
        if key: headers['Idempotency-Key']=key
        body=urlencode(values).encode() if values is not None else None
        with urlopen(Request('https://api.stripe.com/v1/'+path, data=body, headers=headers),timeout=15) as f:return json.load(f)

    def limit(self, client, category='write'):
        now=int(time.time());key=self.digest('rate:'+category+':'+client)
        with self.db() as db:
            db.execute('BEGIN IMMEDIATE');db.execute('DELETE FROM rate WHERE expires < ?', (now,))
            row=db.execute('SELECT hits FROM rate WHERE key=?',(key,)).fetchone()
            if row and row['hits']>=(240 if category=='read' else 40):raise ValueError('rate_limited')
            db.execute('INSERT INTO rate VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1',(key,now+600))

    @staticmethod
    def capacity(row):
        if row['plan']=='owner' and row['source']=='complimentary': return None
        return PLANS[row['plan']]['devices']

    def checkout(self, plan, expected=None):
        if not self.enabled():raise ValueError('sales_not_enabled')
        if plan not in PLANS:raise ValueError('unknown_plan')
        oid=secrets.token_urlsafe(24);proof=secrets.token_urlsafe(32)
        now=int(time.time());entitlement='lifetime' if now < OFFER_END else 'annual'
        if expected is not None and expected != entitlement:raise ValueError('offer_changed')
        with self.db() as db:db.execute('INSERT INTO orders(id,proof,plan,license_hash,created,mode,entitlement) VALUES (?,?,?,?,?,?,?)',(oid,self.digest(proof),plan,self.digest(self.code(oid)),now,os.environ.get('MORPH_PLUS_MODE','test'),entitlement))
        price=os.environ['MORPH_STRIPE_'+plan.upper()+'_PRICE']
        info=self.stripe('prices/'+price)
        if info.get('unit_amount')!=PLANS[plan]['usd'] or info.get('currency')!='usd' or info.get('type')!='one_time' or not info.get('active'):raise ValueError('price_configuration_mismatch')
        session=self.stripe('checkout/sessions',{'mode':'payment','line_items[0][price]':price,'line_items[0][quantity]':1,
          'client_reference_id':oid,'metadata[morph_order]':oid,'metadata[morph_entitlement]':entitlement,'payment_intent_data[metadata][morph_order]':oid,
          'custom_text[submit][message]':('Morph TV Plus: lifetime activation. One payment, no annual renewal. Launch offer terms are fixed when this checkout opens.' if entitlement=='lifetime' else 'Morph TV Plus: 365 days of activation from confirmed payment. Manual annual renewal; no automatic recurring charge.'),
          'success_url':self.origin+'/plus.html#order='+oid+'&proof='+proof,
          'cancel_url':self.origin+'/plus.html','billing_address_collection':'auto'},'morph-plus-'+oid)
        if not str(session.get('url','')).startswith('https://checkout.stripe.com/'):raise ValueError('invalid_checkout_url')
        with self.db() as db:db.execute('UPDATE orders SET session=? WHERE id=?',(session['id'],oid))
        return {'checkout':session['url'],'order':oid,'proof':proof,'entitlement':entitlement}

    def fulfill(self, session_id):
        session=self.stripe('checkout/sessions/'+session_id+'?expand[]=line_items')
        oid=session.get('client_reference_id')
        with self.db() as db:
            row=db.execute('SELECT * FROM orders WHERE id=?',(oid,)).fetchone()
            if not row or row['session']!=session_id or row['source']!='stripe':raise ValueError('order_mismatch')
            plan=PLANS[row['plan']];items=session.get('line_items',{}).get('data',[])
            if session.get('payment_status')!='paid':return
            if session.get('mode')!='payment' or session.get('currency')!='usd' or session.get('amount_total')!=plan['usd'] or len(items)!=1 or items[0].get('quantity')!=1 or items[0].get('price',{}).get('id')!=os.environ['MORPH_STRIPE_'+row['plan'].upper()+'_PRICE']:raise ValueError('payment_mismatch')
            if session.get('livemode') != (os.environ.get('MORPH_PLUS_MODE','test')=='live'):raise ValueError('payment_mode_mismatch')
            if row['mode'] != os.environ.get('MORPH_PLUS_MODE','test'):raise ValueError('payment_mode_mismatch')
            # Replay must not extend an annual license. Sessions opened during
            # the offer retain the lifetime terms shown at checkout creation.
            expires=row['expires']
            if row['entitlement']=='annual' and not row['paid']:
                expires=int(time.time())+ANNUAL_SECONDS
            db.execute('UPDATE orders SET paid=1,payment=?,expires=? WHERE id=?',(session['payment_intent'],expires,oid))

    def order_status(self, order, proof):
        with self.db() as db:
            row=db.execute('SELECT * FROM orders WHERE id=? AND proof=?',(order,self.digest(str(proof or '')))).fetchone()
        if not row:raise ValueError('unknown_order')
        # Only the authenticated purchase owner may request Stripe reconciliation.
        # Claim a short DB-backed cooldown before network I/O, across workers.
        reconcile=False
        if not row['paid'] and not row['revoked'] and row['source']=='stripe' and row['session'] and row['mode']==os.environ.get('MORPH_PLUS_MODE','test') and self.enabled():
            now=int(time.time());key=self.digest('reconcile:'+row['id'])
            with self.db() as db:
                db.execute('BEGIN IMMEDIATE')
                prior=db.execute('SELECT expires FROM rate WHERE key=?',(key,)).fetchone()
                if not prior or prior['expires']<=now:
                    db.execute('INSERT INTO rate VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET expires=excluded.expires',(key,now+30))
                    reconcile=True
            if reconcile:self.fulfill(row['session'])
        # Re-read after Stripe or a concurrent webhook; never trust browser flags.
        with self.db() as db:
            row=db.execute('SELECT * FROM orders WHERE id=?',(row['id'],)).fetchone()
            paid=bool(row['paid'] and not row['revoked'] and row['mode']==os.environ.get('MORPH_PLUS_MODE','test'))
            result={'paid':paid}
            if paid:
                result.update(code=self.register_short(db,row['id']),plan=row['plan'],maxDevices=self.capacity(row),entitlement=row['entitlement'],expiresAt=row['expires'])
        return result

    def webhook(self, body, header):
        if not self.enabled():raise ValueError('sales_not_enabled')
        parts=header.split(',');timestamp=next((p[2:] for p in parts if p.startswith('t=')), '')
        if not timestamp.isdigit() or abs(time.time()-int(timestamp))>300:raise ValueError('invalid_signature')
        expected=hmac.new(os.environ['MORPH_STRIPE_WEBHOOK_SECRET'].encode(),timestamp.encode()+b'.'+body,hashlib.sha256).hexdigest()
        if not any(hmac.compare_digest(expected,p[3:]) for p in parts if p.startswith('v1=')):raise ValueError('invalid_signature')
        event=json.loads(body);eid=event.get('id','')
        if not re.fullmatch(r'evt_[A-Za-z0-9]+',eid):raise ValueError('invalid_event')
        with self.db() as db:
            if db.execute('SELECT 1 FROM events WHERE id=?',(eid,)).fetchone():return
        obj=event['data']['object'];kind=event['type']
        if kind in ['checkout.session.completed','checkout.session.async_payment_succeeded']:
            # The Stripe account can also sell unrelated products. Acknowledge
            # those events without creating a Morph license or repeated failures.
            with self.db() as db:owned=db.execute("SELECT 1 FROM orders WHERE session=? AND source='stripe'",(obj.get('id'),)).fetchone()
            if owned:self.fulfill(obj['id'])
        elif kind in ['charge.refunded','charge.dispute.created']:
            payment=obj.get('payment_intent')
            if not payment and obj.get('charge'):payment=self.stripe('charges/'+obj['charge']).get('payment_intent')
            if payment:
                with self.db() as db:db.execute('UPDATE orders SET revoked=1 WHERE payment=?',(payment,))
        with self.db() as db:db.execute('INSERT OR IGNORE INTO events VALUES (?,?)',(eid,int(time.time())))

    def lookup(self, db, code):
        if not re.fullmatch(r'(?:MORPH-[A-Z2-7]{32}|MT-[A-Z2-7]{12})',str(code)):raise ValueError('invalid_license')
        # Paid orders only. The code is derived, never stored in plaintext.
        row=db.execute("SELECT * FROM orders WHERE (license_hash=? OR id=(SELECT license FROM short_codes WHERE hash=?)) AND ((paid=1 AND mode=?) OR source='complimentary') AND revoked=0",(self.digest(code),self.digest(code),os.environ.get('MORPH_PLUS_MODE','test'))).fetchone()
        if row and (row['entitlement']=='lifetime' or row['expires'] is not None and row['expires']>int(time.time())):return row
        raise ValueError('invalid_license')

    def activate(self, code, device, name):
        if not re.fullmatch(r'[A-Za-z0-9_-]{20,80}',str(device)):raise ValueError('invalid_device')
        token=secrets.token_urlsafe(32)
        with self.db() as db:
            db.execute('BEGIN IMMEDIATE');row=self.lookup(db,code);oid=row['id']
            old=db.execute('SELECT 1 FROM devices WHERE license=? AND device=?',(oid,device)).fetchone()
            if not old and self.capacity(row) is not None and db.execute('SELECT COUNT(*) FROM devices WHERE license=?',(oid,)).fetchone()[0]>=self.capacity(row):raise ValueError('device_limit')
            db.execute('INSERT INTO devices VALUES (?,?,?,?,?) ON CONFLICT(license,device) DO UPDATE SET token=excluded.token,name=excluded.name',(oid,device,str(name)[:60],self.digest(token),int(time.time())))
        return {'token':token,'active':True,'scope':'tv','plan':row['plan'],'maxDevices':self.capacity(row)}

    def studio(self, code, device):
        if not re.fullmatch(r'[A-Za-z0-9_-]{20,80}',str(device)):raise ValueError('invalid_device')
        token=secrets.token_urlsafe(32)
        with self.db() as db:
            row=self.lookup(db,code)
            db.execute('INSERT INTO studios VALUES (?,?,?,?) ON CONFLICT(license,device) DO UPDATE SET token=excluded.token',(self.digest(token),row['id'],device,int(time.time())))
        return {'token':token,'active':True,'scope':'studio','plan':row['plan']}

    def check(self, token):
        with self.db() as db:
            valid=" AND (o.entitlement='lifetime' OR o.expires>?)"
            params=(self.digest(token),os.environ.get('MORPH_PLUS_MODE','test'),int(time.time()))
            row=db.execute("SELECT o.plan,'tv' AS scope FROM devices d JOIN orders o ON o.id=d.license WHERE d.token=? AND ((o.paid=1 AND o.mode=?) OR o.source='complimentary') AND o.revoked=0"+valid,params).fetchone()
            if not row:row=db.execute("SELECT o.plan,'studio' AS scope FROM studios s JOIN orders o ON o.id=s.license WHERE s.token=? AND ((o.paid=1 AND o.mode=?) OR o.source='complimentary') AND o.revoked=0"+valid,params).fetchone()
        return {'active':bool(row),'scope':row['scope'] if row else None,'plan':row['plan'] if row else None}

    @staticmethod
    def email(value):
        if not isinstance(value,str) or len(value)>254:raise ValueError('invalid_email')
        value=value.strip().lower()
        if not re.fullmatch(r"[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+",value):raise ValueError('invalid_email')
        if len(value.split('@')[0])>64:raise ValueError('invalid_email')
        return value

    def grants(self):
        with self.db() as db:
            rows=db.execute("SELECT g.email,g.name,g.created,g.updated,o.id,o.plan,o.source,o.revoked,(SELECT COUNT(*) FROM devices d WHERE d.license=o.id) AS used FROM grants g JOIN orders o ON o.id=g.license WHERE o.source='complimentary' ORDER BY g.updated DESC,g.email LIMIT 1001").fetchall()
        return {'grants':[dict(r,maxDevices=self.capacity(r)) for r in rows[:1000]],'truncated':len(rows)>1000}

    def grant_action(self, data, actor):
        action=data.get('action');now=int(time.time())
        with self.db() as db:
            db.execute('BEGIN IMMEDIATE')
            if action=='save':
                email=self.email(data.get('email'));plan=data.get('plan');name=data.get('name','')
                if plan not in GRANT_PLANS or not isinstance(name,str) or len(name)>80 or any(ord(c)<32 for c in name):raise ValueError('invalid_grant')
                row=db.execute('SELECT o.* FROM grants g JOIN orders o ON o.id=g.license WHERE g.email=?',(email,)).fetchone()
                if row:
                    oid=row['id']
                    if GRANT_PLANS[plan]['devices'] is not None and db.execute('SELECT COUNT(*) FROM devices WHERE license=?',(oid,)).fetchone()[0]>GRANT_PLANS[plan]['devices']:raise ValueError('remove_devices_first')
                    # Editing a disabled grant never silently re-enables it.
                    db.execute('UPDATE orders SET plan=? WHERE id=?',(plan,oid))
                    db.execute('UPDATE grants SET name=?,updated=? WHERE email=?',(name.strip(),now,email))
                else:
                    oid='gift_'+secrets.token_urlsafe(24)
                    db.execute("INSERT INTO orders(id,proof,plan,license_hash,paid,source,created) VALUES (?,?,?,?,0,'complimentary',?)",(oid,self.digest(secrets.token_urlsafe(32)),plan,self.digest(self.code(oid)),now))
                    db.execute('INSERT INTO grants VALUES (?,?,?,?,?)',(email,oid,name.strip(),now,now))
            elif action in ['code','devices','revoke','restore','remove-device']:
                oid=data.get('id')
                row=db.execute("SELECT o.* FROM orders o JOIN grants g ON g.license=o.id WHERE o.id=? AND o.source='complimentary'",(oid,)).fetchone()
                if not row:raise ValueError('unknown_grant')
                if action=='code':
                    if row['revoked']:raise ValueError('grant_disabled')
                    result={'code':self.register_short(db,oid)}
                elif action=='devices':
                    result={'devices':[dict(r) for r in db.execute('SELECT device,name,created FROM devices WHERE license=? ORDER BY created',(oid,))]}
                elif action in ['revoke','restore']:
                    db.execute('UPDATE orders SET revoked=? WHERE id=?',(1 if action=='revoke' else 0,oid))
                    if action=='revoke':
                        # Re-enabling requires entering the code again; old tokens remain dead.
                        db.execute('DELETE FROM devices WHERE license=?',(oid,));db.execute('DELETE FROM studios WHERE license=?',(oid,))
                    db.execute('UPDATE grants SET updated=? WHERE license=?',(now,oid))
                else:
                    device=data.get('device')
                    if not isinstance(device,str):raise ValueError('invalid_device')
                    db.execute('DELETE FROM devices WHERE license=? AND device=?',(oid,device))
            else:raise ValueError('invalid_action')
            db.execute('INSERT INTO grant_audit(license,action,actor,created) VALUES (?,?,?,?)',(oid,action,actor,now))
        return result if action in ['code','devices'] else {'ok':True,'id':oid}

    def handle(self, handler, path):
        if not path.startswith('/api/plus/'):return False
        if handler.command=='OPTIONS':
            handler.send_response(204);handler.send_header('Access-Control-Allow-Methods','GET, POST, OPTIONS');handler.send_header('Access-Control-Allow-Headers','Content-Type, Authorization');handler.send_header('Content-Length','0');handler.end_headers();return True
        if handler.command=='GET' and path.startswith('/api/plus/assets/'):
            token=handler.headers.get('Authorization','').removeprefix('Bearer ')
            if not self.check(token)['active']:handler.send_json(403,{'error':'plus_required'});return True
            filename=path.removeprefix('/api/plus/assets/')
            manifest=json.loads((Path(os.environ.get('MORPH_SITE_ROOT','/usr/share/nginx/html'))/'theme-packs/catalog.json').read_text(encoding='utf-8'))
            if not any(f['file']==filename for p in manifest['packs'] for f in p['files']) and not any(f['file']==filename for f in manifest.get('legacyFiles',[])):handler.send_json(404,{'error':'not_found'});return True
            handler.send_response(200);handler.send_header('Content-Type','image/webp');handler.send_header('Cache-Control','no-store');handler.send_header('X-Accel-Redirect','/_artifacts/theme-packs/'+filename);handler.end_headers();return True
        if handler.command=='GET' and path=='/api/plus/plans':
            handler.send_json(200,{'enabled':self.enabled(),'plans':PLANS,'freeThemes':FREE,'mode':os.environ.get('MORPH_PLUS_MODE','test'),'offer':{'startsAt':OFFER_START,'endsAt':OFFER_END,'serverNow':int(time.time()),'active':time.time()<OFFER_END,'during':'lifetime','after':'annual','annualDays':365,'autoRenew':False,'existingLifetimePreserved':True}});return True
        if handler.command!='POST':handler.send_json(405,{'error':'method_not_allowed'});return True
        try:
            n=int(handler.headers.get('Content-Length','0'))
            if n<1 or n>(262144 if path.endswith('/webhook') else 4096):raise ValueError('invalid_size')
            body=handler.rfile.read(n)
            if path=='/api/plus/webhook':self.webhook(body,handler.headers.get('Stripe-Signature',''));result={'ok':True}
            else:
                origin=handler.headers.get('Origin','')
                if not self.client_origin_allowed(origin,path):raise ValueError('origin_rejected')
                self.limit(handler.headers.get('X-Client-IP',handler.client_address[0]),'read' if path in ['/api/plus/order','/api/plus/status'] else 'write');data=json.loads(body)
                if path=='/api/plus/checkout':result=self.checkout(data.get('plan'),data.get('expectedEntitlement'))
                elif path=='/api/plus/order':result=self.order_status(data.get('order'),data.get('proof'))
                elif path=='/api/plus/activate':result=self.activate(data.get('code'),data.get('device'),data.get('name','TV'))
                elif path=='/api/plus/studio':result=self.studio(data.get('code'),data.get('device'))
                elif path=='/api/plus/status':result=self.check(str(data.get('token','')))
                elif path=='/api/plus/devices':
                    with self.db() as db:
                        row=self.lookup(db,data.get('code'));devices=db.execute('SELECT device,name,created FROM devices WHERE license=?',(row['id'],)).fetchall()
                    result={'devices':[dict(x) for x in devices],'maxDevices':self.capacity(row)}
                elif path=='/api/plus/remove-device':
                    with self.db() as db:
                        row=self.lookup(db,data.get('code'));db.execute('DELETE FROM devices WHERE license=? AND device=?',(row['id'],data.get('device')))
                    result={'removed':True}
                else:handler.send_json(404,{'error':'not_found'});return True
            handler.send_json(200,result)
        except (ValueError,KeyError,TypeError) as error:
            reason=str(error)
            visible={'invalid_license','device_limit','invalid_device','rate_limited','origin_rejected'}
            handler.send_json(400,{'error':reason if path in ['/api/plus/activate','/api/plus/studio','/api/plus/status'] and reason in visible else 'invalid_or_unavailable_request'})
        except (URLError,TimeoutError):handler.send_json(503,{'error':'payment_service_unavailable'})
        return True
