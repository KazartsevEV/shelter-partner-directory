import pathlib,zipfile,xml.etree.ElementTree as ET,json,math
base=pathlib.Path(__file__).resolve().parent
protocol=json.loads((base/'protocol.json').read_text());ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'};records=[]
for expected in protocol['downloads']:
 p=base/expected['file']
 with zipfile.ZipFile(p) as z:
  strings=[''.join(e.itertext()) for e in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',ns)]
  doc=ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
  cells={e.attrib['r']:e for e in doc.findall('.//s:c',ns)}
  assert all(e.find('s:f',ns) is None for e in cells.values())
  def value(ref):
   e=cells[ref];v=e.find('s:v',ns)
   return strings[int(v.text)] if e.attrib.get('t')=='s' else float(v.text)
  assert value('A2')=='v1-1';assert value('B2')=='Хлопковый шоппер · Казахстан · 220 г/м²';assert value('D2')=='KZT'
  for ref,key in [('E2','priceList'),('G2','priceCustomer')]:
   assert cells[ref].attrib.get('t','n')=='n';assert math.isclose(value(ref),expected[key],abs_tol=1e-8)
  records.append({'file':expected['file'],'currency':value('D2'),'priceList':value('E2'),'priceCustomer':value('G2'),'numericMoneyCells':True,'formulas':False,'reader':'Python stdlib zipfile + ElementTree'})
output={'implementationHead':'b26889945a033924f672dd445c876d488305cbfa','files':len(records),'records':records}
(base/'xlsx-validation.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n');print('INDEPENDENT_XLSX_GREEN',len(records))
