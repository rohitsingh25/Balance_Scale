import os
import random
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from game_logic import Game

app = Flask(__name__)

# Enable CORS for all routes (public stateless API)
CORS(app, resources={r"/*": {"origins": "*"}})

# Global dictionary to store rooms: room_code (str) -> Game instance
games = {}

def generate_room_code():
    while True:
        code = f"{random.randint(1000, 9999)}"
        if code not in games:
            return code

def cleanup_old_games():
    now = time.time()
    # Delete rooms that have been inactive for more than 1 hour
    expired_codes = [code for code, g in games.items() if now - g.last_activity > 3600]
    for code in expired_codes:
        print(f"Cleaning up inactive room: {code}")
        del games[code]

@app.route('/create-room', methods=['POST'])
def create_room():
    cleanup_old_games()
    
    data = request.json or {}
    player_name = data.get('player_name', '').strip()
    if not player_name:
        return jsonify({"error": "Player name is required"}), 400
        
    room_code = generate_room_code()
    creator_id = f"p_{random.randint(100000, 999999)}"
    
    # Initialize game room
    game = Game(room_code, creator_id, player_name)
    games[room_code] = game
    
    print(f"Created room {room_code} by {player_name} ({creator_id})")
    return jsonify({
        "room_code": room_code,
        "player_id": creator_id,
        "room_state": game.get_state(viewer_id=creator_id)
    })

@app.route('/join-room', methods=['POST'])
def join_room():
    data = request.json or {}
    room_code = str(data.get('room_code', '')).strip()
    player_name = data.get('player_name', '').strip()
    
    if not room_code or not player_name:
        return jsonify({"error": "Room code and player name are required"}), 400
        
    game = games.get(room_code)
    if not game:
        return jsonify({"error": "Room not found"}), 404
        
    player_id = f"p_{random.randint(100000, 999999)}"
    res = game.add_player(player_id, player_name)
    
    if "error" in res:
        return jsonify(res), 400
        
    print(f"Player {player_name} ({player_id}) joined room {room_code}")
    return jsonify({
        "player_id": player_id,
        "room_state": game.get_state(viewer_id=player_id)
    })

@app.route('/room-state/<room_code>', methods=['GET'])
def get_room_state(room_code):
    game = games.get(room_code)
    if not game:
        return jsonify({"error": "Room not found"}), 404
        
    # Lazy timer check: resolve the round if 15 seconds have passed
    game.check_timer_and_run()
    
    # Update activity timestamp
    player_id = request.args.get('player_id')
    if player_id:
        game.last_activity = time.time()
        
    return jsonify(game.get_state(viewer_id=player_id))

@app.route('/submit-choice', methods=['POST'])
def submit_choice():
    data = request.json or {}
    room_code = data.get('room_code')
    player_id = data.get('player_id')
    number = data.get('number')
    
    game = games.get(room_code)
    if not game:
        return jsonify({"error": "Room not found"}), 404
        
    if number is None:
        return jsonify({"error": "Selection number is required"}), 400
    if not isinstance(number, int) or not (0 <= number <= 100):
        return jsonify({"error": "Number must be an integer between 0 and 100"}), 400
        
    res = game.submit_player_choice(player_id, number)
    if "error" in res:
        return jsonify(res), 400
        
    return jsonify(game.get_state(viewer_id=player_id))

@app.route('/add-bot', methods=['POST'])
def add_bot():
    data = request.json or {}
    room_code = data.get('room_code')
    player_id = data.get('player_id')
    
    game = games.get(room_code)
    if not game:
        return jsonify({"error": "Room not found"}), 404
        
    if game.creator_id != player_id:
        return jsonify({"error": "Only the room creator can add bots"}), 403
        
    res = game.add_bot()
    if "error" in res:
        return jsonify(res), 400
        
    return jsonify(game.get_state(viewer_id=player_id))

@app.route('/remove-bot', methods=['POST'])
def remove_bot():
    data = request.json or {}
    room_code = data.get('room_code')
    player_id = data.get('player_id')
    bot_id = data.get('bot_id')
    
    game = games.get(room_code)
    if not game:
        return jsonify({"error": "Room not found"}), 404
        
    if game.creator_id != player_id:
        return jsonify({"error": "Only the room creator can remove bots"}), 403
        
    res = game.remove_bot(bot_id)
    if "error" in res:
        return jsonify(res), 400
        
    return jsonify(game.get_state(viewer_id=player_id))

@app.route('/start-game', methods=['POST'])
def start_game():
    data = request.json or {}
    room_code = data.get('room_code')
    player_id = data.get('player_id')
    
    game = games.get(room_code)
    if not game:
        return jsonify({"error": "Room not found"}), 404
        
    if game.creator_id != player_id:
        return jsonify({"error": "Only the room creator can start the game"}), 403
        
    res = game.start_game()
    if "error" in res:
        return jsonify(res), 400
        
    return jsonify(game.get_state(viewer_id=player_id))

@app.route('/next-round', methods=['POST'])
def next_round():
    data = request.json or {}
    room_code = data.get('room_code')
    player_id = data.get('player_id')
    
    game = games.get(room_code)
    if not game:
        return jsonify({"error": "Room not found"}), 404
        
    if game.creator_id != player_id:
        return jsonify({"error": "Only the room creator can proceed to next round"}), 403
        
    res = game.next_round()
    if "error" in res:
        return jsonify(res), 400
        
    return jsonify(game.get_state(viewer_id=player_id))

@app.route('/leave-room', methods=['POST'])
def leave_room():
    data = request.json or {}
    room_code = data.get('room_code')
    player_id = data.get('player_id')
    
    game = games.get(room_code)
    if not game:
        return jsonify({"error": "Room not found"}), 404
        
    res = game.remove_player(player_id)
    if "error" in res:
        return jsonify(res), 400
        
    # If no humans left, dissolve room
    humans = [p for p in game.players if not p.is_bot]
    if not humans:
        print(f"Dissolving room {room_code} because no human players remain")
        if room_code in games:
            del games[room_code]
            
    return jsonify({"status": "success"})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "rooms_active": len(games)})

@app.route('/active-rooms', methods=['GET'])
def active_rooms():
    return jsonify({"rooms_active": len(games)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
