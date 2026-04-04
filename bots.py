import random
import statistics

class BotAI:
    def __init__(self, bot_id, name, archetype):
        self.bot_id = bot_id
        self.name = name
        self.archetype = archetype  # Conservative, Gambler, Follower, Contrarian, Anxious, Balanced
        self.memory = []  # List of past round results (mean, winning numbers, etc.)

    def make_choice(self, active_players_count, history):
        """
        Decides a number between 0 and 100 based on archetype and history.
        history: List of dicts containing {'mean': float, 'choices': [int], 'survivors': [int]}
        """
        # Default fallback
        choice = random.randint(0, 100)

        # Noise to prevent predictability
        noise = random.randint(-2, 2)
        
        last_round = history[-1] if history else None
        
        if self.archetype == "Conservative":
            # Tends to stick to central values or previous mean
            if last_round:
                target = last_round['mean']
                choice = int(target) + noise
            else:
                choice = 50 + noise

        elif self.archetype == "Gambler":
            # Picks extremes
            if random.random() < 0.5:
                choice = 0 + abs(noise)
            else:
                choice = 100 - abs(noise)

        elif self.archetype == "Follower":
            # Picks a number that was safe/close to mean last time
            if last_round and last_round['survivors']:
                choice = random.choice(last_round['survivors']) + noise
            else:
                choice = 50 + noise

        elif self.archetype == "Contrarian":
            # Tries to be far from the previous mean
            if last_round:
                if last_round['mean'] > 50:
                    choice = random.randint(0, 40)
                else:
                    choice = random.randint(60, 100)
            else:
                choice = random.choice([10, 90]) + noise

        elif self.archetype == "Anxious":
            # Random erratic behavior
            choice = random.randint(0, 100)

        elif self.archetype == "Balanced":
             # Tries to aim for the likely mean (which is often near 50 initially, or shifts)
             choice = 50 + random.randint(-15, 15)

        # Ensure bounds 0-100
        choice = max(0, min(100, choice))
        
        # Avoid picking same number as self last time if possible? (Simulate human avoidance)
        # Simple implementation for now.

        return choice
