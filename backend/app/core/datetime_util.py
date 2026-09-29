import datetime

def utc_now() -> datetime.datetime:
    """
    Returns the current UTC datetime as a naive datetime object.
    Maintains clean cross-database compatibility with both SQLite and PostgreSQL
    while avoiding Python 3.12 datetime.utcnow() deprecation warnings.
    """
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
