"""Komut satırı: `python -m app.cli run` | `report [YYYY-AA-GG]`"""
import sys
from datetime import date

from .db import session_scope
from .services import pipeline, reports


def main(argv: list[str]) -> int:
    cmd = argv[1] if len(argv) > 1 else ""
    if cmd == "run":
        pipeline.run_daily()
    elif cmd == "report":
        d = date.fromisoformat(argv[2]) if len(argv) > 2 else pipeline.today()
        with session_scope() as db:
            print(reports.daily_report(db, d)["text"])
    else:
        print(__doc__)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
