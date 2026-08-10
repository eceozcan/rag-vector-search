from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer

app = Flask(__name__)
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

@app.route('/embed', methods=['POST'])
def embed():
    data = request.get_json(force=True)
    text = data.get('input') or data.get('texts')
    if text is None:
        return jsonify({'error': 'input required'}), 400
    if isinstance(text, list):
        embs = model.encode(text, show_progress_bar=False)
        return jsonify({'embedding': [e.tolist() for e in embs]})
    vec = model.encode(text, show_progress_bar=False)
    return jsonify({'embedding': vec.tolist()})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
