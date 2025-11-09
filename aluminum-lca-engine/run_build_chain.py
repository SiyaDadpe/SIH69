import json
import os
import brightway2 as bw
from src.engine.database_manager import AluminumDatabaseManager
from src.utils.config import Config


def main():
    mgr = AluminumDatabaseManager()
    params_path = os.path.join('data', 'default_parameters.json')
    with open(params_path, 'r') as f:
        defaults = json.load(f)

    all_params = {
        'mining': defaults.get('mining', {}),
        'beneficiation': defaults.get('beneficiation', {}),
        'refining': defaults.get('refining', {}),
        'smelting': defaults.get('smelting', {}),
        'manufacturing': {
            'electricity_kwh_per_kg': defaults.get('rolling', {}).get('electricity_kwh_per_kg', 0.75),
            'natural_gas_mj_per_kg': defaults.get('casting', {}).get('natural_gas_mj_per_kg', 2.0)
        },
        'recycling': defaults.get('recycling', {}),
        'waste': defaults.get('waste', {}),
    }

    final_product = mgr.build_complete_chain(all_params)

    al_db = bw.Database(Config.ALUMINUM_DB_NAME)
    print('DB name:', al_db.name)
    print('Activity count:', len(list(al_db)))
    print('Activity codes:', sorted([a.get("code") for a in al_db]))

    lookup = {a.get('code'): a for a in al_db}
    smelting = lookup.get('aluminum_smelting')
    alumina = lookup.get('alumina_refining')
    benef = lookup.get('beneficiation')
    mining = lookup.get('bauxite_mining')
    print('Link check (smelting->alumina->beneficiation->mining):', bool(smelting and alumina and benef and mining))
    if smelting:
        print('Smelting technosphere inputs:', [ (e.input.get('code'), e['amount'], e['type']) for e in smelting.exchanges() if e['type']=='technosphere'])
    if alumina:
        print('Alumina technosphere inputs:', [ (e.input.get('code'), e['amount'], e['type']) for e in alumina.exchanges() if e['type']=='technosphere'])


if __name__ == '__main__':
    main()
