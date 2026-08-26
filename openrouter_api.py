import requests
import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')


def openrouter_request(query, model='qwen/qwen3.8-flash', max_tokens=10000, reasoning=True):
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {OPENROUTER_API_KEY}',
    }

    json_data = {
        'model': model,
        'messages': [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": query
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "https://live.staticflickr.com/3851/14825276609_098cac593d_b.jpg"
            }
          },
          {
            "type": "video_url",
            "video_url": {
              "url": "https://storage.googleapis.com/cloud-samples-data/video/JaneGoodall.mp4"
            }
          }
        ]
      }
    ],
    'max_tokens': max_tokens,
    'reasoning': {"enabled": reasoning}
    }

    response = requests.post('https://openrouter.ai/api/v1/chat/completions', headers=headers, json=json_data)
    return response.json()['choices'][0]['message']['content']