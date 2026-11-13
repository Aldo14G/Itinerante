"""Run: python3 -B -m unittest discover -s tests -p test_import_inventario.py   (necesita openpyxl y Pillow, como el importador)"""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('import_inventario', ROOT / 'scripts/import-inventario.py')
imp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(imp)

AGENCIA = {'tipo': 'agencia-isbn', 'nombre': 'Agencia ISBN', 'url': 'https://isbn.example/1'}
OTRA_A = {'tipo': 'otra', 'nombre': 'Catálogo A', 'url': 'https://a.example/libro'}
OTRA_B = {'tipo': 'otra', 'nombre': 'Catálogo B', 'url': 'https://b.example/libro'}


def fila(**campos):
  return {'fila': 9, 'editorial': 'Editorial de la hoja', 'titulo': 'Un libro', 'autor': 'Alguien', 'precio': 250, 'sinopsis': None,
          'genero': 'Narrativa', 'isbn': None, 'foto': None, 'avisos': [], **campos}


def dato(valor, fuentes=(AGENCIA,), **extra):
  return {'valor': valor, 'consulta': '2026-11-13', 'fuentes': list(fuentes), **extra}


def carga(campos):
  with tempfile.TemporaryDirectory() as tmp:
    path = Path(tmp) / 'complementos.json'
    path.write_text(json.dumps({'libros': {'un-libro-alguien': {'campos': campos}}}), encoding='utf-8')
    return imp.load_complementos(str(path))


class Complementos(unittest.TestCase):
  def test_completa_solo_lo_que_la_hoja_trae_vacio(self):
    r = fila()
    val, aplicados = imp.complementa(r, {'isbn': dato('9786075954097'), 'sinopsis': dato('Texto de la editorial.'), 'editorial': dato('Otra editorial')})
    self.assertEqual(['isbn', 'sinopsis'], aplicados)
    self.assertEqual('9786075954097', val['isbn'])
    self.assertEqual('Texto de la editorial.', val['sinopsis'])
    self.assertEqual('Editorial de la hoja', val['editorial'], 'la hoja trae editorial: gana la hoja')
    self.assertIsNone(r['isbn'], 'el renglón sigue siendo la copia fiel de la hoja')
    self.assertIn('completado con data/complementos.json: isbn, sinopsis', r['avisos'])
    self.assertTrue(any('trae editorial distinto del complemento: gana la hoja' in a for a in r['avisos']))

  def test_isbn_ajeno_solo_se_corrige_si_el_conflicto_esta_registrado(self):
    r = fila(isbn='978-607-59540-0-4')
    val, aplicados = imp.complementa(r, {'isbn': dato('9786075954097', corrige='9786075954004')})
    self.assertEqual((['isbn'], '9786075954097'), (aplicados, val['isbn']))
    self.assertTrue(any('es de otro libro' in a for a in r['avisos']))
    sin_registro = fila(isbn='978-607-59540-0-4')
    val, aplicados = imp.complementa(sin_registro, {'isbn': dato('9786075954097')})
    self.assertEqual(([], '978-607-59540-0-4'), (aplicados, val['isbn']), 'sin `corrige`, el ISBN de la hoja se queda')

  def test_si_la_hoja_cambia_gana_la_hoja_y_avisa(self):
    otro = fila(isbn='978-607-99067-0-2')
    val, aplicados = imp.complementa(otro, {'isbn': dato('9786075954097', corrige='9786075954004')})
    self.assertEqual(([], '978-607-99067-0-2'), (aplicados, val['isbn']))
    self.assertTrue(any('gana la hoja' in a for a in otro['avisos']))
    igual = fila(isbn='978-607-59540-9-7')
    val, aplicados = imp.complementa(igual, {'isbn': dato('9786075954097', corrige='9786075954004')})
    self.assertEqual([], aplicados)
    self.assertTrue(any('sobra' in a for a in igual['avisos']), 'cuando la hoja ya trae el dato, el complemento sobra y se dice')

  def test_sin_complemento_no_cambia_nada(self):
    r = fila()
    val, aplicados = imp.complementa(r, {})
    self.assertEqual(([], []), (aplicados, r['avisos']))
    self.assertEqual({c: r[c] for c in imp.COMPLEMENTABLES}, val)

  def test_el_precio_no_se_complementa(self):
    self.assertNotIn('precio', imp.COMPLEMENTABLES)
    with self.assertRaises(SystemExit) as e: carga({'precio': dato('250')})
    self.assertIn('el precio sale siempre de la hoja', str(e.exception))

  def test_exige_fuente_primaria_o_dos_independientes(self):
    self.assertIn('un-libro-alguien', carga({'sinopsis': dato('Texto.', (AGENCIA,))}))
    self.assertIn('un-libro-alguien', carga({'sinopsis': dato('Texto.', (OTRA_A, OTRA_B))}))
    with self.assertRaises(SystemExit): carga({'sinopsis': dato('Texto.', (OTRA_A,))})
    with self.assertRaises(SystemExit): carga({'sinopsis': dato('Texto.', (OTRA_A, {**OTRA_A, 'nombre': 'La misma, otra vez'}))})
    with self.assertRaises(SystemExit): carga({'sinopsis': dato('Texto.', ())})
    with self.assertRaises(SystemExit): carga({'sinopsis': {'valor': 'Texto.', 'fuentes': [AGENCIA]}})  # sin fecha de consulta

  def test_valida_isbn_genero_y_corrige(self):
    with self.assertRaises(SystemExit): carga({'isbn': dato('9786075954090')})  # dígito de control
    with self.assertRaises(SystemExit): carga({'genero': dato('Novela gráfica')})  # fuera de los géneros de la hoja
    with self.assertRaises(SystemExit): carga({'sinopsis': dato('Texto.', corrige='Otro texto')})  # `corrige` es solo del ISBN
    self.assertIn('un-libro-alguien', carga({'genero': dato('Narrativa'), 'isbn': dato('9786075954097', corrige='9786075954004')}))

  def test_el_registro_real_pasa_la_revision(self):
    libros = imp.load_complementos()
    self.assertTrue(libros)
    for libro in libros.values():
      self.assertTrue(libro['campos'])


if __name__ == '__main__':
  unittest.main()
