import requests
import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')


def openrouter_request(
    query, 
    model='qwen/qwen3.8-flash',
    use_web_search=True,
    max_tokens=10000, 
    reasoning=True, 
    image_url=None, 
    video_url=None, 
    audio_url=None, 
    file_url=None
    ):

    if use_web_search:
        model = model + ':online'

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
    'max_tokens': max_tokens,
    'reasoning': {"enabled": reasoning}
    }

    response = requests.post('https://openrouter.ai/api/v1/chat/completions', headers=headers, json=json_data)
    return response.json()['choices'][0]['message']['content']

if __name__ == '__main__':
    response = openrouter_request(
        query='Give me a link to a yoga class in New York City taking place tomorrow morning and the price of the class',
        model='qwen/qwen3.8-flash',
        use_web_search=True,
        max_tokens=10000,
        reasoning=True,
        image_url=None,
        video_url=None,
        audio_url=None,
        file_url=None
    )