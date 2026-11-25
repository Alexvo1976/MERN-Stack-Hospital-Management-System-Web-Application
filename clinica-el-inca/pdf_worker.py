import sys,json,pymupdf as fitz
import hashlib
from pathlib import Path
mode,path=sys.argv[1:3]
doc=fitz.open(path)
if mode=='inspect' and hashlib.sha256(Path(path).read_bytes()).hexdigest()=='1a302d79a13a636f3951749cace5d5c22b0ede67618dab6548961856f5a42441':
 profile=json.loads(Path(__file__).with_name('premier-spanish-fields.json').read_text())
 print(json.dumps({'fields':profile,'pages':[{'width':612,'height':792}],'warnings':['Mapa específico del PDF Premier Dermatology. Revise campos adicionales y casillas manualmente. No contiene cédula; úselo como formulario de especialidad.']},ensure_ascii=False))
elif mode=='inspect':
 fields=[]; pages=[]; warnings=[]
 for i,p in enumerate(doc):
  if i>=20: raise ValueError('Máximo 20 páginas')
  pages.append({'width':p.rect.width,'height':p.rect.height})
  for w in p.widgets() or []:
   if w.field_type==fitz.PDF_WIDGET_TYPE_TEXT:
    fields.append({'label':w.field_label or w.field_name,'widget':w.field_name,'page':i,'rect':list(w.rect),'type':'text','key':''})
  if not list(p.widgets() or []):
   tp=None
   if not p.get_text().strip():
    try: tp=p.get_textpage_ocr(language='spa+eng',dpi=150,full=True)
    except Exception: warnings.append('Página '+str(i+1)+': OCR no disponible; agregue campos manualmente.')
   for line in p.get_text('dict',textpage=tp)['blocks']:
    for row in line.get('lines',[]):
     s=''.join(x['text'] for x in row['spans']).strip()
     if ':' in s:
      label=s.split(':')[0].strip()
      x0,y0,x1,y1=row['bbox']
      if 1<len(label)<90 and x1+8<p.rect.width-15:
       fields.append({'label':label,'page':i,'rect':[x1+4,y0,p.rect.width-12,max(y1+3,y0+16)],'type':'text','key':''})
 print(json.dumps({'fields':fields,'pages':pages,'warnings':warnings},ensure_ascii=False))
elif mode=='render':
 data=json.load(sys.stdin)
 for f in data['fields']:
  p=doc[f['page']]; value=str(data['values'].get(f['id'],''))
  if f.get('widget'):
   for w in p.widgets() or []:
    if w.field_name==f['widget']:
     w.field_value=value; w.update()
  else:
   if not value: continue
   rect=fitz.Rect(f['rect'])
   size=10
   while size>=5:
    if p.insert_textbox(rect,value,fontsize=size,fontname='helv')>=0: break
    size-=1
   else: raise ValueError('Texto no cabe: '+f['label'])
 # Keep original page geometry and content; bake widget appearances for consistent printing.
 doc.bake(annots=False,widgets=True)
 doc.save(sys.argv[3],garbage=3,deflate=True)
