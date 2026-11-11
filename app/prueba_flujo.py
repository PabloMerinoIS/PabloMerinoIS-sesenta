import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel='chrome', args=['--no-sandbox'])
        ctx = await b.new_context(viewport={'width':375,'height':800}); await ctx.grant_permissions(['clipboard-read','clipboard-write'])
        pg = await ctx.new_page(); logs=[]
        pg.on('console', lambda m: logs.append(m.text) if m.type=='error' else None); pg.on('pageerror', lambda e: logs.append(str(e)))
        await pg.goto('file://' + __import__('os').path.abspath('index.html') + ''); R={}
        R['overflow'] = await pg.evaluate('document.documentElement.scrollWidth>document.documentElement.clientWidth')
        # ejemplo 3 (pago parcial, plazo 90): carta formal menciona el tope
        await pg.click('.row:has-text("Portol")'); await pg.click('[data-tone="formal"]'); t = await pg.input_value('#letter')
        R['cap_in_letter'] = 'limita el plazo de pago a 60' in t; R['no_costas'] = 'costas' not in t
        # factura nueva sin número, formato inglés
        await pg.click('#btn-add'); await pg.fill('#f-client','Prueba SL'); await pg.fill('#f-amount','1,234.50'); await pg.fill('#f-delivered','2026-08-03'); await pg.click('#f-submit')
        R['amount_en'] = await pg.inner_text('.dhead p'); R['tone_new'] = await pg.get_attribute('[data-tone="recordatorio"]','aria-selected')
        t = await pg.input_value('#letter'); R['subject'] = t.split('\n')[0]; R['holes_note'] = await pg.locator('.note:has-text("faltan tus datos")').count()
        # borrador se conserva
        await pg.fill('#letter','MI TEXTO'); await pg.click('[data-tone="formal"]'); await pg.click('[data-tone="recordatorio"]'); R['draft_kept'] = await pg.input_value('#letter')
        await pg.click('[data-act="reset-letter"]'); R['draft_reset'] = (await pg.input_value('#letter')).startswith('Asunto')
        # pagar todo tarde -> cobrada tarde
        await pg.fill('#pay-date','2026-10-20'); await pg.fill('#pay-amount','1234,5'); await pg.click('#form-pay button')
        R['status'] = await pg.inner_text('.dhead .pill'); R['tabs_late'] = await pg.locator('[data-tone]').count(); t = await pg.input_value('#letter')
        R['late_letter_ok'] = ('se pagó con' in t) and ('sigue pendiente' not in t) and ('Principal pendiente' not in t)
        segs = await pg.eval_on_selector_all('.detail tbody tr td:last-child','e=>e.map(x=>x.textContent)'); R['segs']=segs; R['int_total'] = await pg.inner_text('.detail tfoot tr:first-child td:last-child')
        # asof tecleado
        await pg.fill('#asof','2027-03-15'); await pg.dispatch_event('#asof','change'); R['asof_banner'] = await pg.locator('.banner:has-text("no a hoy")').count()
        R['paydate_default'] = await pg.input_value('#pay-date')
        await pg.click('[data-act="mark"][data-step="formal"]'); R['mark_date'] = await pg.inner_text('.steps li.done .sub')
        await pg.click('[data-act="today"]')
        # particular y administración
        await pg.click('#btn-add'); await pg.fill('#f-client','Ayto'); await pg.fill('#f-amount','500'); await pg.fill('#f-delivered','2026-06-01'); await pg.select_option('#f-kind','admin'); await pg.click('#f-submit')
        R['admin_note'] = await pg.locator('.note:has-text("Administraciones")').count(); R['admin_letter'] = await pg.locator('#letter').count()
        R['admin_row'] = await pg.inner_text('.row[aria-current="true"] .meta')
        # mis datos: validación
        await pg.click('#btn-profile'); await pg.fill('#p-iban','hola'); await pg.click('#form-profile button[type=submit]'); R['iban_err'] = bool(await pg.inner_text('#p-iban-err'))
        await pg.fill('#p-iban','ES91 2100 0418 4502 0005 1332'); await pg.fill('#p-name','Marta Ruiz'); await pg.fill('#p-email','m@example.com'); await pg.click('#form-profile button[type=submit]')
        # restaurar con confirmación
        await pg.click('#btn-backup'); await pg.fill('#b-text','{"invoices":[]}'); await pg.click('#b-restore'); R['restore_confirm'] = await pg.inner_text('#b-restore'); R['still'] = await pg.locator('.row').count()
        await pg.click('#dlg-backup [data-close]')
        # escape cancela eliminar
        await pg.click('[data-act="delete"]'); await pg.keyboard.press('Escape'); R['esc_cancel'] = await pg.locator('[data-act="delete-yes"]').count()
        R['overflow_end'] = await pg.evaluate('document.documentElement.scrollWidth>document.documentElement.clientWidth')
        R['console']=logs
        await pg.click('.row:has-text("Prueba")'); await pg.screenshot(path='captura.png', full_page=True)
        print(json.dumps(R, ensure_ascii=False, indent=1)); await b.close()
asyncio.run(main())
