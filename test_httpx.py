import httpx
import json

async def test():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api-inference.huggingface.co/models/gpt2",
            json={"inputs": "test"}
        )
        print("STATUS:", response.status_code)
        print("BODY:", response.text)

import asyncio
asyncio.run(test())
