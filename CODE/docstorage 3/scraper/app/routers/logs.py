import logging
import time
from fastapi import APIRouter

router = APIRouter()
logs = []


class ListHandler(logging.Handler):
    def emit(self, record):
        logs.append({
            "ts": time.time(),
            "level": record.levelname.lower(),
            "message": self.format(record),
        })
        if len(logs) > 1000:
            logs.pop(0)


handler = ListHandler()
handler.setFormatter(logging.Formatter("%(message)s"))

root_logger = logging.getLogger()
root_logger.addHandler(handler)
root_logger.setLevel(logging.DEBUG)

logging.getLogger("scraper").addHandler(handler)
logging.getLogger("scraper").setLevel(logging.DEBUG)


@router.get("")
async def get_logs(limit: int = 200):
    return logs[-limit:]
