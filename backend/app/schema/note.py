from pydantic import BaseModel
class notecreate(BaseModel):
    title:str
    content:str
    