"""
Configuration file for CarnaMapa scraper.
Contains city URLs and constants.
"""

# City configuration: slug -> (name, base_url)
CITIES = {
    'sao-paulo': {
        'name': 'São Paulo',
        'url': 'https://www.blocosderua.com/programacao-blocos-de-carnaval-sp',
    },
    'rio-de-janeiro': {
        'name': 'Rio de Janeiro',
        'url': 'https://www.blocosderua.com/rio-de-janeiro/programacao-carnaval-blocos-de-rua',
    },
    'belo-horizonte': {
        'name': 'Belo Horizonte',
        'url': 'https://www.blocosderua.com/belo-horizonte/programacao-carnaval-blocos-de-rua',
    },
    'salvador': {
        'name': 'Salvador',
        'url': 'https://www.blocosderua.com/salvador/programacao-carnaval',
    },
    'florianopolis': {
        'name': 'Florianópolis',
        'url': 'https://www.blocosderua.com/florianopolis/programacao-carnaval-blocos-de-rua',
    },
    'recife-olinda': {
        'name': 'Recife/Olinda',
        'url': 'https://www.blocosderua.com/recife-olinda/programacao-carnaval',
    },
    'brasilia': {
        'name': 'Brasília',
        'url': 'https://www.blocosderua.com/brasilia/programacao-carnaval',
    },
    'porto-alegre': {
        'name': 'Porto Alegre',
        'url': 'https://www.blocosderua.com/porto-alegre/programacao-carnaval',
    },
    'fortaleza': {
        'name': 'Fortaleza',
        'url': 'https://www.blocosderua.com/fortaleza/programacao-carnaval',
    },
}

# Scraper settings
USER_AGENT = 'CarnaMapa/1.0 (Educational carnival block aggregator)'
REQUESTS_TIMEOUT = 30  # seconds

# Timezone for Brazil (most cities use BRT = UTC-3)
DEFAULT_TIMEZONE = '-03:00'

# Valid Brazil coordinate bounds (for validation)
BRAZIL_BOUNDS = {
    'min_lon': -73.98,
    'max_lon': -32.39,
    'min_lat': -33.75,
    'max_lat': 5.27,
}
