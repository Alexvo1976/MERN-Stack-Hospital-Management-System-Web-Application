import json,sys,subprocess, pathlib
import pymupdf as fitz
# Recreate only explicitly labelled DEMO templates, never clinical originals.
data=pathlib.Path('data');data.mkdir(exist_ok=True)
raw=subprocess.check_output(['docker','compose','exec','-T','mongo','mongosh','leones_demo','--quiet','--eval','JSON.stringify(db.templates.find({name:/^DEMO [|] /}).toArray())'],text=True)
for t in json.loads(raw):
 if not t.get('name','').startswith('DEMO | '): continue
 p=data/t['file']
 if p.exists(): continue
 doc=fitz.open()
 for page in t['pages']: doc.new_page(width=page['width'],height=page['height'])
 for page in doc:
  page.insert_text((30,30),t['name']+' - RECREADO / SOLO PRUEBAS',fontsize=10)
 for f in t['fields']:
  page=doc[f['page']];r=fitz.Rect(f['rect'])
  page.insert_text((r.x0,max(42,r.y0-4)),f['label'],fontsize=8)
  if f.get('widget'):
   w=fitz.Widget();w.field_name=f['widget'];w.field_type=fitz.PDF_WIDGET_TYPE_TEXT;w.rect=r;w.text_fontsize=10;page.add_widget(w)
  else: page.draw_rect(r,color=(.7,.7,.7),width=.5)
 doc.save(p);doc.close();print('Recreado:',t['name'])
print('Reinicie la API para respaldar los archivos en GridFS. No se han recreado documentos históricos.')
