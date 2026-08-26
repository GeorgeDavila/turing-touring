import requests
import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
MODEL = "qwen/qwen3-235b-a22b-2507" #"qwen/qwen3.8-flash" #'qwen/qwen3.6-27b'

my_query = '''Give me a link to a yoga class in New York City taking place tomorrow morning and the price of the class.
Only return the link, time, and price in json format.'''

def openrouter_request(
    query, 
    model=MODEL,
    use_web_search=True,
    max_tokens=10000, 
    reasoning=True, 
    image_url=None, 
    video_url=None, 
    audio_url=None, 
    file_url=None
    ):

    tools = []
    if use_web_search:
        tools.append({"type": "openrouter:web_search"})

    content = []
    if query is not None:
        content.append({
            "type": "text",
            "text": query
        })
    if image_url is not None:
        content.append({
            "type": "image_url",
            "image_url": {
                "url": image_url
            }   
        })
    if video_url is not None:
        content.append({
            "type": "video_url",
            "video_url": {
                "url": video_url
            }   
        })
    if audio_url is not None:
        content.append({
            "type": "audio_url",
            "audio_url": {
                "url": audio_url
            }   
        })
    if file_url is not None:
        content.append({
            "type": "file_url",
            "file_url": {
                "url": file_url
            }   
        })
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {OPENROUTER_API_KEY}',
    }

    json_data = {
        'model': model,
        'messages': [
            {
                "role": "user",
                "content": content
            }
            ],
        'tools': tools,
        "tool_choice": "auto",
        'max_tokens': max_tokens,
        'reasoning': {"enabled": reasoning}
    }

    response = requests.post('https://openrouter.ai/api/v1/chat/completions', headers=headers, json=json_data)
    print(response.json())
    return response.json()['choices'][0]['message']['content']

if __name__ == '__main__':
    response = openrouter_request(
        query=my_query,
        model=MODEL,
        use_web_search=True,
        max_tokens=1000,
        reasoning=True,
        image_url=None,
        video_url=None,
        audio_url=None,
        file_url=None
    )

    print(response)
