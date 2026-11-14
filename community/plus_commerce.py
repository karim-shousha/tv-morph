"""Confirmed payment delivery, private receipt review and activation network evidence."""
import base64
import binascii
import io
import ipaddress
import json
import os
import re
import secrets
import sqlite3
import smtplib
import ssl
import time
from decimal import Decimal
from email.message import EmailMessage
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen

MAX_IMAGE = 2 * 1024 * 1024
RECEIPT_TTL = 7 * 86400


class PlusCommerce:
    def init_commerce(self, db):
        db.executescript("""
        CREATE TABLE IF NOT EXISTS plus_delivery(
          license TEXT PRIMARY KEY, email TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
          retry INTEGER NOT NULL DEFAULT 0, sent INTEGER);
        CREATE TABLE IF NOT EXISTS plus_receipts(
          license TEXT PRIMARY KEY, email TEXT NOT NULL, reference TEXT NOT NULL, amount INTEGER NOT NULL,
          filename TEXT, state TEXT NOT NULL, created INTEGER NOT NULL, reviewed INTEGER);
        CREATE TABLE IF NOT EXISTS plus_networks(
          license TEXT NOT NULL, device TEXT NOT NULL, network TEXT NOT NULL, first_seen INTEGER NOT NULL,
          last_seen INTEGER NOT NULL, PRIMARY KEY(license,device,network));
        CREATE INDEX IF NOT EXISTS plus_receipts_state ON plus_receipts(state,created);
        """)
        self.receipt_dir = self.path.parent / 'plus-private-receipts'
        self.receipt_dir.mkdir(mode=0o700, exist_ok=True)

    @staticmethod
    def mail_enabled():
        return all(os.environ.get(k) for k in ('MORPH_SMTP_HOST', 'MORPH_SMTP_FROM', 'MORPH_SMTP_USER', 'MORPH_SMTP_PASSWORD'))

    def queue_delivery(self, db, order, email):
        if not email:
            return
        try:
            address = self.email(email)
        except ValueError:
            return
        db.execute('INSERT OR IGNORE INTO plus_delivery(license,email) VALUES (?,?)', (order,address))

    def deliver_one(self):
        if not self.mail_enabled():
            return False
        now = int(time.time())
        with self.db() as db:
            db.execute('BEGIN IMMEDIATE')
            row = db.execute("""SELECT d.* FROM plus_delivery d JOIN orders o ON o.id=d.license
                WHERE d.sent IS NULL AND d.retry<=? AND o.paid=1 AND o.revoked=0 AND o.mode='live'
                AND (o.expires IS NULL OR o.expires>?) ORDER BY d.retry LIMIT 1""", (now,now)).fetchone()
            if not row:
                return False
            db.execute('UPDATE plus_delivery SET retry=?,attempts=attempts+1 WHERE license=?',
                       (now+min(21600,60*2**min(row['attempts'],9)),row['license']))
            code = self.register_short(db,row['license'])
        mail = EmailMessage()
        mail['From'] = os.environ['MORPH_SMTP_FROM']
        mail['To'] = row['email']
        mail['Subject'] = 'Your Morph TV Plus activation code'
        mail['Message-ID'] = '<plus-'+self.digest(row['license'])+'@morph-tv.com>'
        mail.set_content(f'Morph TV Plus\n\nActivation code: {code}\n\nEnter it in Morph Plus on your device.\nhttps://morph-tv.com/plus.html\n')
        port = int(os.environ.get('MORPH_SMTP_PORT','587'))
        context = ssl.create_default_context()
        host = os.environ['MORPH_SMTP_HOST']
        if port == 465:
            connection = smtplib.SMTP_SSL(host,port,timeout=15,context=context)
        else:
            connection = smtplib.SMTP(host,port,timeout=15)
        with connection as smtp:
            if port != 465:
                smtp.starttls(context=context)
            smtp.login(os.environ['MORPH_SMTP_USER'],os.environ['MORPH_SMTP_PASSWORD'])
            smtp.send_message(mail)
            with self.db() as db:
                db.execute('UPDATE plus_delivery SET sent=? WHERE license=?',(int(time.time()),row['license']))
        return True

    def commerce_worker(self):
        next_cleanup = 0
        while True:
            try:
                now = int(time.time())
                if now >= next_cleanup:
                    self.expire_receipts()
                    with self.db() as db:
                        db.execute('DELETE FROM plus_networks WHERE last_seen<?',(now-30*86400,))
                    next_cleanup = now+900
                if self.deliver_one():
                    continue
            except (OSError, ValueError, sqlite3.Error, smtplib.SMTPException):
                # Delivery was rescheduled before contacting SMTP. Never log recipient or code.
                print('Morph Plus commerce job will retry',flush=True)
            time.sleep(15)

    @staticmethod
    def paypal_enabled():
        return all(os.environ.get(k) for k in ('MORPH_PAYPAL_CLIENT_ID','MORPH_PAYPAL_SECRET','MORPH_PAYPAL_WEBHOOK_ID'))

    def paypal(self, path, payload=None, request_id=None):
        host = 'https://api-m.paypal.com' if os.environ.get('MORPH_PLUS_MODE')=='live' else 'https://api-m.sandbox.paypal.com'
        client = os.environ['MORPH_PAYPAL_CLIENT_ID']+':'+os.environ['MORPH_PAYPAL_SECRET']
        auth = {'Authorization':'Basic '+base64.b64encode(client.encode()).decode()}
        with urlopen(Request(host+'/v1/oauth2/token',data=b'grant_type=client_credentials',headers=auth),timeout=15) as response:
            token = json.load(response)['access_token']
        headers = {'Authorization':'Bearer '+token,'Content-Type':'application/json'}
        if request_id:
            headers['PayPal-Request-Id'] = request_id
        data = None if payload is None else json.dumps(payload).encode()
        with urlopen(Request(host+'/'+path,data=data,headers=headers),timeout=20) as response:
            return json.load(response)

    def paypal_checkout(self, order, proof, amount):
        if not self.paypal_enabled():
            raise ValueError('sales_not_enabled')
        result = self.paypal('v2/checkout/orders',{
            'intent':'CAPTURE',
            'purchase_units':[{'custom_id':order,'amount':{'currency_code':'USD','value':f'{Decimal(amount)/100:.2f}'}}],
            'payment_source':{'paypal':{'experience_context':{'user_action':'PAY_NOW',
                'return_url':self.origin+'/plus.html?'+urlencode({'paypal':'return'})+'#'+urlencode({'order':order,'proof':proof}),
                'cancel_url':self.origin+'/plus.html'}}}
        }, order)
        session = result.get('id','')
        url = next((link['href'] for link in result.get('links',[]) if link.get('rel') in ('approve','payer-action')), '')
        parsed = urlsplit(url)
        if not re.fullmatch(r'[A-Z0-9]{8,40}',session) or parsed.scheme!='https' or parsed.hostname not in ('www.paypal.com','www.sandbox.paypal.com'):
            raise ValueError('invalid_checkout_url')
        return session,url

    def paypal_capture(self, session, capture=True):
        if not self.paypal_enabled() or not re.fullmatch(r'[A-Z0-9]{8,40}',str(session)):
            raise ValueError('payment_mismatch')
        result = self.paypal('v2/checkout/orders/'+session)
        if capture and result.get('status')=='APPROVED':
            result = self.paypal('v2/checkout/orders/'+session+'/capture',{},self.digest('capture:'+session)[:32])
        if result.get('status')!='COMPLETED':
            return
        units = result.get('purchase_units',[])
        if len(units)!=1 or result.get('id')!=session:
            raise ValueError('payment_mismatch')
        unit = units[0]
        captures = unit.get('payments',{}).get('captures',[])
        if len(captures)!=1 or captures[0].get('status')!='COMPLETED':
            return
        payment = captures[0]
        amount = payment.get('amount',{})
        with self.db() as db:
            db.execute('BEGIN IMMEDIATE')
            row = db.execute("SELECT * FROM orders WHERE source='paypal' AND session=?",(session,)).fetchone()
            if not row or row['id']!=unit.get('custom_id') or row['mode']!=os.environ.get('MORPH_PLUS_MODE','test'):
                raise ValueError('order_mismatch')
            if amount.get('currency_code')!='USD' or amount.get('value')!=f"{Decimal(self.plan_cents(row['plan']))/100:.2f}" or not re.fullmatch(r'[A-Z0-9]{8,40}',str(payment.get('id'))):
                raise ValueError('payment_mismatch')
            email = result.get('payer',{}).get('email_address') or result.get('payment_source',{}).get('paypal',{}).get('email_address')
            self.mark_paid(db,row,'paypal:'+payment['id'],email)

    def paypal_webhook(self, body, headers):
        if not self.paypal_enabled():
            raise ValueError('sales_not_enabled')
        event = json.loads(body)
        verification = {key:headers.get('PayPal-'+header,'') for key,header in {
            'transmission_id':'Transmission-Id','transmission_time':'Transmission-Time',
            'cert_url':'Cert-Url','auth_algo':'Auth-Algo','transmission_sig':'Transmission-Sig'}.items()}
        if not all(verification.values()):
            raise ValueError('invalid_signature')
        verification.update(webhook_id=os.environ['MORPH_PAYPAL_WEBHOOK_ID'],webhook_event=event)
        if self.paypal('v1/notifications/verify-webhook-signature',verification).get('verification_status')!='SUCCESS':
            raise ValueError('invalid_signature')
        kind = event.get('event_type')
        resource = event.get('resource',{})
        if kind in ('CHECKOUT.ORDER.APPROVED','PAYMENT.CAPTURE.COMPLETED'):
            session = resource.get('id') if kind=='CHECKOUT.ORDER.APPROVED' else resource.get('supplementary_data',{}).get('related_ids',{}).get('order_id')
            with self.db() as db:
                owned = db.execute("SELECT 1 FROM orders WHERE source='paypal' AND session=?",(session,)).fetchone()
            if owned:
                self.paypal_capture(session)
        elif kind in ('PAYMENT.CAPTURE.REFUNDED','PAYMENT.CAPTURE.REVERSED'):
            capture = resource.get('supplementary_data',{}).get('related_ids',{}).get('capture_id')
            if not capture:
                capture = next((urlsplit(link.get('href','')).path.rsplit('/',1)[-1] for link in resource.get('links',[]) if link.get('rel')=='up' and '/captures/' in link.get('href','')),None)
            if not capture and kind=='PAYMENT.CAPTURE.REVERSED':
                capture = resource.get('id')
            if capture:
                with self.db() as db:
                    db.execute('UPDATE orders SET revoked=1 WHERE payment=?',('paypal:'+capture,))

    def submit_receipt(self, plan, amount, entitlement, email, reference, image):
        from PIL import Image
        email = self.email(email)
        reference = re.sub(r'[\s-]+','',str(reference or '')).upper()
        if not re.fullmatch(r'[A-Z0-9]{6,50}',reference):
            raise ValueError('invalid_transfer_reference')
        if not isinstance(image,str) or len(image)>4*((MAX_IMAGE+2)//3):
            raise ValueError('invalid_image')
        try:
            raw = base64.b64decode(image,validate=True)
            with Image.open(io.BytesIO(raw),formats=['JPEG','PNG','WEBP']) as picture:
                if picture.width*picture.height>12_000_000 or len(raw)>MAX_IMAGE:
                    raise ValueError('invalid_image')
                picture.thumbnail((1600,1600))
                encoded = io.BytesIO()
                picture.convert('RGB').save(encoded,format='JPEG',quality=85)
        except (OSError, ValueError, binascii.Error, Image.DecompressionBombError) as error:
            raise ValueError('invalid_image') from error
        oid = secrets.token_urlsafe(24)
        proof = secrets.token_urlsafe(32)
        name = oid+'.jpg'
        now = int(time.time())
        try:
            with self.db() as db:
                db.execute('BEGIN IMMEDIATE')
                if db.execute("SELECT COUNT(*) FROM plus_receipts WHERE state='pending'").fetchone()[0]>=500:
                    raise ValueError('receipt_queue_full')
                if db.execute("SELECT COUNT(*) FROM plus_receipts WHERE email=? AND state='pending'",(email,)).fetchone()[0]>=3:
                    raise ValueError('receipt_queue_full')
                with (self.receipt_dir/name).open('xb') as file:
                    file.write(encoded.getvalue())
                db.execute("""INSERT INTO orders(id,proof,plan,license_hash,created,source,mode,entitlement)
                    VALUES (?,?,?,?,?,'instapay','live',?)""",(oid,self.digest(proof),plan,self.digest(self.code(oid)),now,entitlement))
                db.execute("INSERT INTO plus_receipts VALUES (?,?,?,?,?,'pending',?,NULL)",(oid,email,reference,amount,name,now))
        except BaseException:
            (self.receipt_dir/name).unlink(missing_ok=True)
            raise
        return {'order':oid,'proof':proof,'receiptState':'pending'}

    def expire_receipts(self):
        now = int(time.time())
        with self.db() as db:
            db.execute('BEGIN IMMEDIATE')
            db.execute("UPDATE plus_receipts SET state='expired',reviewed=? WHERE state='pending' AND created<?",(now,now-RECEIPT_TTL))
            for row in db.execute("SELECT license,filename FROM plus_receipts WHERE state!='pending' AND filename IS NOT NULL").fetchall():
                (self.receipt_dir/row['filename']).unlink(missing_ok=True)
                db.execute('UPDATE plus_receipts SET filename=NULL WHERE license=?',(row['license'],))
        # Remove orphan uploads left by an interrupted DB transaction.
        for path in self.receipt_dir.glob('*.jpg'):
            if path.stat().st_mtime<now-RECEIPT_TTL:
                path.unlink(missing_ok=True)

    def receipt_image(self, order):
        with self.db() as db:
            row = db.execute("SELECT filename FROM plus_receipts WHERE license=? AND state='pending'",(order,)).fetchone()
        if not row or not row['filename']:
            return None
        try:
            return (self.receipt_dir/row['filename']).read_bytes()
        except FileNotFoundError:
            return None

    def review_receipt(self, data, actor):
        oid = data.get('id')
        approved = data.get('action')=='approve-receipt'
        with self.db() as db:
            db.execute('BEGIN IMMEDIATE')
            receipt = db.execute('SELECT * FROM plus_receipts WHERE license=?',(oid,)).fetchone()
            if not receipt or receipt['state']!='pending':
                raise ValueError('receipt_not_pending')
            if approved:
                if data.get('confirmed') is not True:
                    raise ValueError('transfer_not_verified')
                payment = 'instapay:'+self.digest(receipt['reference'])
                if db.execute('SELECT 1 FROM orders WHERE payment=?',(payment,)).fetchone():
                    raise ValueError('transfer_already_used')
                order = db.execute('SELECT * FROM orders WHERE id=?',(oid,)).fetchone()
                self.mark_paid(db,order,payment,receipt['email'])
            now = int(time.time())
            db.execute('UPDATE plus_receipts SET state=?,reviewed=? WHERE license=?',('approved' if approved else 'rejected',now,oid))
            db.execute('INSERT INTO grant_audit(license,action,actor,created) VALUES (?,?,?,?)',(oid,data['action'],actor,now))
        self.expire_receipts()
        return {'ok':True}

    def observe_network(self, db, order, device, address):
        try:
            ip = ipaddress.ip_address(address)
        except ValueError:
            return
        ip = getattr(ip,'ipv4_mapped',None) or ip
        if not ip.is_global:
            return
        network = ipaddress.ip_network((ip,32 if ip.version==4 else 64),strict=False)
        fingerprint = self.digest(f'plus-network:{order}:{network}')
        now = int(time.time())
        recorded = db.execute("""INSERT INTO plus_networks VALUES (?,?,?,?,?)
            ON CONFLICT(license,device,network) DO UPDATE SET last_seen=excluded.last_seen
            WHERE last_seen < excluded.last_seen-3600""",(order,device,fingerprint,now,now))
        if recorded.rowcount:
            db.execute("""DELETE FROM plus_networks WHERE license=? AND rowid NOT IN
                (SELECT rowid FROM plus_networks WHERE license=? ORDER BY last_seen DESC LIMIT 50)""",(order,order))

    def network_summary(self, db, order):
        rows = db.execute('SELECT device,network,last_seen FROM plus_networks WHERE license=? AND last_seen>=?',(order,int(time.time())-30*86400)).fetchall()
        networks = {r['network'] for r in rows}
        devices = {r['device'] for r in rows}
        return {'networks':len(networks),'devices':len(devices),'differentNetwork':len(networks)>1,
                'possibleSharing':len(networks)>1 and len(devices)>1,'lastSeen':max((r['last_seen'] for r in rows),default=None)}
