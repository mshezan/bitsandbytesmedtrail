from typing import List, Dict, Any
from abc import ABC, abstractmethod

class Connector(ABC):
    def __init__(self, org_id: str):
        self.org_id = org_id

    @abstractmethod
    def fetch(self) -> Any:
        pass

    @abstractmethod
    def validate(self, raw_data: Any) -> bool:
        pass

    @abstractmethod
    def normalize(self, raw_data: Any) -> List[Dict[str, Any]]:
        pass
