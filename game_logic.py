import statistics
import math
from bots import BotAI
import random

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

    def to_dict(self):
        return {
            "id": self.pid,
            "name": self.name,
            "is_bot": self.is_bot,
            "points": self.points,
            "is_eliminated": self.is_eliminated,
            "elimination_reason": self.elimination_reason,
            "elimination_round": self.elimination_round,
            "current_choice": self.current_choice,
            "round_penalty": self.round_penalty,
            "round_distance": self.round_distance,
            "round_sd_units": self.round_sd_units,
            "archetype": self.archetype
        }

class Game:
    def __init__(self):
        self.players = []
        self.round_number = 0
        self.game_over = False
        self.history = [] 
        self.human_submitted = False
        self.winner = None
        self.bot_names = [
            "Alpha", "Bravo", "Charlie", "Delta", "Echo", 
            "Foxtrot", "Golf", "Hotel", "India", "Juliet", 
            "Kilo", "Lima", "Mike", "November", "Oscar"
        ]

    def start_game(self, bot_count=5):
        self.players = []
        # Add Human
        self.players.append(Player("human", "You", is_bot=False))
        
        # Add Bots with cool names
        available_names = self.bot_names[:]
        random.shuffle(available_names)
        
        archetypes = ["Conservative", "Gambler", "Follower", "Contrarian", "Anxious", "Balanced"]
        for i in range(bot_count):
            arch = archetypes[i % len(archetypes)]
            name = available_names.pop() if available_names else f"Bot {i+1}"
            self.players.append(Player(f"bot_{i}", name, is_bot=True, archetype=arch))
        
        self.round_number = 1
        self.game_over = False
        self.winner = None
        self.history = []
        self.human_submitted = False

    def submit_human_choice(self, number):
        if self.game_over:
            return {"error": "Game over"}
        
        human = next((p for p in self.players if not p.is_bot), None)
        
        # logic handled in app.py mainly, but strictly speaking:
        if human and not human.is_eliminated:
             human.current_choice = number
             self.human_submitted = True
        
        return {"status": "success"}

    def run_round(self):
        active_players = [p for p in self.players if not p.is_eliminated]
        
        # Check human
        human = next((p for p in self.players if not p.is_bot), None)
        if human and not human.is_eliminated and not human.is_bot and human.current_choice is None:
             # Human is alive but hasn't chosen
             return {"error": "Human input waiting"}
        
        # If human is eliminated, we proceed with bots only
        
        # 1. Bot Choices
        for p in active_players:
            if p.is_bot:
                p.current_choice = p.bot_logic.make_choice(len(active_players), self.history)
        
        # 2. Duplicate Check
        choices_map = {} 
        for p in active_players:
            n = p.current_choice
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
        # Rule: "Only one player remains OR Human player is eliminated"
        # User REQ: "game will be continued between bots if player gets eliminated"
        # So new rule: Only one player remains.
        
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
        
        if not self.game_over:
            self.round_number += 1
            self.human_submitted = False
        
        return result_data

    def get_state(self):
        return {
            "round": self.round_number,
            "players": [p.to_dict() for p in self.players],
            "game_over": self.game_over,
            "winner": self.winner,
            "last_round_results": self.history[-1] if self.history else None,
            "human_submitted": self.human_submitted
        }
