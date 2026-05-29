import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from game_logic import Game

app = Flask(__name__)

# CORS: Allow Vercel frontend + localhost for development
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Add Vercel production URL from environment variable
vercel_url = os.environ.get("FRONTEND_URL")
if vercel_url:
    allowed_origins.append(vercel_url)

CORS(app, origins=allowed_origins, supports_credentials=True)

game = Game()

@app.route('/start-game', methods=['POST'])
def start_game():
    data = request.json
    bot_count = data.get('bot_count', 5)
    if not isinstance(bot_count, int) or not (1 <= bot_count <= 10):
        bot_count = 5 
    game.start_game(bot_count=bot_count)
    return jsonify(game.get_state())

@app.route('/game-state', methods=['GET'])
def get_state():
    return jsonify(game.get_state())

@app.route('/submit-turn', methods=['POST'])
def submit_turn():
    data = request.json or {}
    number = data.get('number')
    
    # logic: if human present and alive, number is required.
    # if human eliminated, number is ignored/optional.
    
    human = next((p for p in game.players if not p.is_bot), None)
    human_alive = human and not human.is_eliminated
    
    if human_alive:
        if number is None:
            return jsonify({"error": "Number required"}), 400
        if not (0 <= number <= 100):
            return jsonify({"error": "Number must be 0-100"}), 400
        
        res = game.submit_human_choice(number)
        if "error" in res:
             return jsonify(res), 400
    
    # Run round 
    round_results = game.run_round()
    return jsonify(round_results)

# Health check endpoint for Render
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
