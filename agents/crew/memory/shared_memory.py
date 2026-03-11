from pydantic import BaseModel
from agents.crew.memory.persistent_memory import PersistentMemory

class MongoMemory(BaseModel):
    agent_name: str

    @property
    def memory_variables(self):
        return ["history"]

    def load_memory_variables(self, inputs):
        history = PersistentMemory.recall(self.agent_name, "history")
        return {"history": history or []}

    def save_context(self, inputs, outputs):
        PersistentMemory.append(self.agent_name, "history", {
            "input": inputs,
            "output": outputs
        })

    def clear(self):
        pass
