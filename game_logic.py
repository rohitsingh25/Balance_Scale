import statistics
import math
from bots import BotAI
import random
import time

class Player:
    def __init__(self, pid, name, is_bot=False, archetype=None):
        self.pid = pid
        self.name = name
        self.is_bot = is_bot
        self.points = 10
        self.is_eliminated = False
        self.elimination_reason = None # "Duplicate", "Points", "Survive"
        self.elimination_round = None # Track when they died
        self.current_choice = None
        self.round_penalty = 0
        self.round_distance = 0
        self.round_sd_units = 0
        self.history = []
        self.archetype = archetype
        self.bot_logic = BotAI(pid, name, archetype) if is_bot else None

    def to_dict(self, hide_choice=False):
        return {
            "id": self.pid,
            "name": self.name,
            "is_bot": self.is_bot,
            "points": self.points,
            "is_eliminated": self.is_eliminated,
            "elimination_reason": self.elimination_reason,
            "elimination_round": self.elimination_round,
            "current_choice": self.current_choice if not hide_choice else (None if self.current_choice is None else -3),
            "round_penalty": self.round_penalty,
            "round_distance": self.round_distance,
            "round_sd_units": self.round_sd_units,
            "archetype": self.archetype
        }

class Game:
    def __init__(self, room_code, creator_id, creator_name):
        self.room_code = room_code
        self.creator_id = creator_id
        self.status = "lobby"  # lobby, playing, round_results, game_over
        self.round_start_time = None
        self.players = []
        # Add creator
        self.players.append(Player(creator_id, creator_name, is_bot=False))
        
        self.round_number = 0
        self.game_over = False
        self.history = [] 
        self.winner = None
        self.last_round_results = None
        self.last_activity = time.time()
        self.bot_names = [
            "Alpha", "Bravo", "Charlie", "Delta", "Echo", 
            "Foxtrot", "Golf", "Hotel", "India", "Juliet", 
            "Kilo", "Lima", "Mike", "November", "Oscar"
        ]

    def add_player(self, pid, name):
        if self.status != "lobby":
            return {"error": "Game has already started"}
        if len(self.players) >= 10:
            return {"error": "Room is full (max 10 players)"}
        if any(p.pid == pid for p in self.players):
            return {"error": "Player already in room"}
        # Ensure name is unique
        if any(p.name.lower() == name.strip().lower() for p in self.players):
            return {"error": "Name already taken in this room"}
        
        self.players.append(Player(pid, name.strip(), is_bot=False))
        self.last_activity = time.time()
        return {"status": "success"}

    def add_bot(self):
        if self.status != "lobby":
            return {"error": "Game has already started"}
        if len(self.players) >= 10:
            return {"error": "Room is full (max 10 players)"}
            
        # Add a bot with a cool name and archetype
        available_names = [n for n in self.bot_names if not any(p.name == n for p in self.players)]
        if not available_names:
            name = f"Bot {len(self.players) + 1}"
        else:
            name = random.choice(available_names)
            
        archetypes = ["Conservative", "Gambler", "Follower", "Contrarian", "Anxious", "Balanced"]
        bot_idx = sum(1 for p in self.players if p.is_bot)
        arch = archetypes[bot_idx % len(archetypes)]
        
        bot_id = f"bot_{random.randint(100000, 999999)}"
        self.players.append(Player(bot_id, name, is_bot=True, archetype=arch))
        self.last_activity = time.time()
        return {"status": "success"}

    def remove_bot(self, bot_id):
        if self.status != "lobby":
            return {"error": "Game has already started"}
        bot = next((p for p in self.players if p.pid == bot_id and p.is_bot), None)
        if bot:
            self.players.remove(bot)
            self.last_activity = time.time()
            return {"status": "success"}
        return {"error": "Bot not found"}

    def remove_player(self, pid):
        # Find player
        player = next((p for p in self.players if p.pid == pid), None)
        if not player:
            return {"error": "Player not found"}
            
        if self.status == "lobby":
            is_creator = (self.creator_id == pid)
            self.players.remove(player)
            
            # If the creator left, assign a new creator if humans remain, otherwise room will be deleted
            if is_creator and self.players:
                humans = [p for p in self.players if not p.is_bot]
                if humans:
                    self.creator_id = humans[0].pid
            
            self.last_activity = time.time()
            return {"status": "success"}
        else:
            # If in-game, eliminate them
            if not player.is_eliminated:
                player.points = 0
                player.is_eliminated = True
                player.elimination_reason = "Left"
                player.elimination_round = self.round_number
                player.current_choice = -2 # Indicator for left
                self.last_activity = time.time()
                
                # Check if this causes round resolution or game end
                self.check_timer_and_run()
            return {"status": "success"}

    def start_game(self):
        if self.status != "lobby":
            return {"error": "Game already started"}
            
        self.round_number = 1
        self.game_over = False
        self.winner = None
        self.history = []
        self.last_round_results = None
        self.status = "playing"
        self.round_start_time = time.time()
        self.last_activity = time.time()
        
        # Reset players for start of match
        for p in self.players:
            p.points = 10
            p.is_eliminated = False
            p.elimination_reason = None
            p.elimination_round = None
            p.current_choice = None
            p.round_penalty = 0
            p.round_distance = 0
            p.round_sd_units = 0
            p.history = []
            
        return {"status": "success"}

    def submit_player_choice(self, player_id, number):
        if self.status != "playing" or self.game_over:
            return {"error": "Game is not in active playing state"}
            
        player = next((p for p in self.players if p.pid == player_id), None)
        if not player:
            return {"error": "Player not found"}
            
        if player.is_eliminated:
            return {"error": "Player is already eliminated"}
            
        player.current_choice = number
        self.last_activity = time.time()
        
        self.check_timer_and_run()
        return {"status": "success"}

    def check_all_submitted(self):
        alive_humans = [p for p in self.players if not p.is_bot and not p.is_eliminated]
        return all(p.current_choice is not None for p in alive_humans)

    def check_timer_and_run(self):
        if self.status != "playing" or self.game_over:
            return False
            
        # Check if 15 seconds have passed
        if self.round_start_time:
            elapsed = time.time() - self.round_start_time
            if elapsed >= 15.0:
                # Time is up!
                # 1. Eliminate anyone who hasn't submitted yet
                alive_humans = [p for p in self.players if not p.is_bot and not p.is_eliminated]
                for p in alive_humans:
                    if p.current_choice is None:
                        p.points = 0
                        p.is_eliminated = True
                        p.elimination_reason = "Timeout"
                        p.elimination_round = self.round_number
                        p.current_choice = -1 # indicator for Timeout
                
                # 2. Run the round logic
                self.run_round()
                return True
                
        # If time is not up, check if all alive humans have submitted
        alive_humans = [p for p in self.players if not p.is_bot and not p.is_eliminated]
        if all(p.current_choice is not None for p in alive_humans):
            # All active human players have submitted!
            self.run_round()
            return True
            
        return False

    def next_round(self):
        if self.status != "round_results" or self.game_over:
            return {"error": "Game is not waiting for next round"}
            
        self.round_number += 1
        self.status = "playing"
        self.round_start_time = time.time()
        self.last_activity = time.time()
        return {"status": "success"}

    def run_round(self):
        active_players = [p for p in self.players if not p.is_eliminated]
        
        # 1. Bot Choices
        for p in active_players:
            if p.is_bot:
                p.current_choice = p.bot_logic.make_choice(len(active_players), self.history)
        
        # 2. Duplicate Check
        choices_map = {} 
        for p in active_players:
            n = p.current_choice
            # Skip invalid choices (like timeout or left indicator)
            if n is None or n < 0:
                continue
            if n not in choices_map:
                choices_map[n] = []
            choices_map[n].append(p)
            
        eliminated_by_dupe = []
        survivors = []
        
        for n, p_list in choices_map.items():
            if len(p_list) > 1:
                for p in p_list:
                    p.points = 0
                    p.is_eliminated = True
                    p.elimination_reason = "Duplicate"
                    p.elimination_round = self.round_number
                    p.round_penalty = -10 
                    eliminated_by_dupe.append(p)
            else:
                survivors.append(p_list[0])
                p_list[0].elimination_reason = None 
                
        # 3. Stats & Penalties
        survivor_numbers = [p.current_choice for p in survivors]
        mean_val = 0
        sd_val = 0
        
        if len(survivors) == 2:
            # SPECIAL 1v1 DUEL RULES
            p1 = survivors[0]
            p2 = survivors[1]
            n1 = p1.current_choice
            n2 = p2.current_choice
            
            # 0 beats 100 Exception
            if (n1 == 0 and n2 == 100):
                winner = p1
                loser = p2
            elif (n2 == 0 and n1 == 100):
                winner = p2
                loser = p1
            else:
                # Higher number wins
                if n1 > n2:
                    winner = p1
                    loser = p2
                else:
                    winner = p2
                    loser = p1
            
            # Apply penalties
            winner.round_penalty = 0
            loser.round_penalty = -1
            loser.points += -1
            
            # Dummy calculator for display
            mean_val = (n1 + n2) / 2
            try:
                sd_val = statistics.stdev([n1, n2])
            except:
                sd_val = 0
                
            p1.round_distance = 0
            p1.round_sd_units = 0
            p2.round_distance = 0
            p2.round_sd_units = 0
            
        elif survivor_numbers:
            # STANDARD RULES (3+ Players or 1 survivor)
            mean_val = statistics.mean(survivor_numbers)
            if len(survivor_numbers) > 1:
                sd_val = statistics.stdev(survivor_numbers)
            else:
                sd_val = 0 
        
            # 4. Standard Penalties
            closest_dist = float('inf')
            for p in survivors:
                dist = abs(p.current_choice - mean_val)
                p.round_distance = dist
                p.round_sd_units = (dist / sd_val) if sd_val > 0 else 0
                if dist < closest_dist:
                    closest_dist = dist
                    
            for p in survivors:
                if abs(p.round_distance - closest_dist) < 0.0001:
                    p.round_penalty = 0
                else:
                    sd = p.round_sd_units
                    if sd <= 1: loss = 1
                    elif sd <= 2: loss = 2
                    elif sd <= 3: loss = 3
                    else: loss = 4
                    
                    p.round_penalty = -loss
                    p.points += p.round_penalty
        
        # 5. Bankruptcy
        for p in survivors:
            if p.points <= 0:
                p.is_eliminated = True
                p.points = 0 
                p.elimination_reason = "Bankruptcy"
                p.elimination_round = self.round_number
        
        # 6. History
        round_summary = {
            "round": self.round_number,
            "choices": {p.pid: p.current_choice for p in active_players},
            "mean": mean_val,
            "sd": sd_val,
            "survivors": survivor_numbers
        }
        self.history.append(round_summary)
        
        # 7. Game End Check
        active_count = sum(1 for p in self.players if not p.is_eliminated)
        
        if active_count <= 1:
            self.game_over = True
            if active_count == 1:
                winner = next(p for p in self.players if not p.is_eliminated)
                self.winner = winner.name
            else:
                self.winner = "No One"
        else:
            self.game_over = False

        result_data = {
            "round": self.round_number,
            "results": [p.to_dict() for p in self.players], 
            "mean": round(mean_val, 2),
            "sd": round(sd_val, 2),
            "game_over": self.game_over,
            "winner": self.winner,
            "eliminated_by_dupe": [p.pid for p in eliminated_by_dupe]
        }
        
        self.last_round_results = result_data
        
        # Reset choices for the next round
        for p in self.players:
            p.current_choice = None
            
        if self.game_over:
            self.status = "game_over"
        else:
            self.status = "round_results"
        
        self.last_activity = time.time()
        return result_data

    def get_state(self, viewer_id=None):
        time_left = 15.0
        if self.status == "playing" and self.round_start_time:
            elapsed = time.time() - self.round_start_time
            time_left = max(0.0, 15.0 - elapsed)
            
        # Hide choices of other players during the active play phase to prevent cheating
        players_data = []
        for p in self.players:
            hide = (self.status == "playing" and p.pid != viewer_id and not p.is_eliminated)
            players_data.append(p.to_dict(hide_choice=hide))
            
        return {
            "room_code": self.room_code,
            "creator_id": self.creator_id,
            "status": self.status,
            "round": self.round_number,
            "players": players_data,
            "game_over": self.game_over,
            "winner": self.winner,
            "last_round_results": self.last_round_results,
            "time_left": round(time_left, 1),
            "history": self.history
        }

