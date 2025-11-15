from datetime import datetime, timedelta
from typing import List, Dict
import statistics

class StressDetector:
    """Detects financial stress patterns in student spending"""
    
    def __init__(self):
        # Stress thresholds
        self.LATE_NIGHT_HOUR = 21  # 9 PM
        self.EARLY_MORNING_HOUR = 6  # 6 AM
        self.HIGH_FREQUENCY_THRESHOLD = 3  # transactions per day
        self.SPIKE_THRESHOLD = 0.5  # 50% increase
        self.BALANCE_DECLINE_THRESHOLD = 0.3  # 30% decline
    
    def analyze_stress_patterns(self, transactions: List, days: int = 7) -> Dict:
        """Analyze transactions for stress patterns"""
        
        if not transactions:
            return {
                'stress_level': 'none',
                'score': 0,
                'signals': [],
                'recommendations': []
            }
        
        # Filter recent transactions
        cutoff_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        recent = [t for t in transactions if t.date >= cutoff_date and t.type == 'debit']
        
        if len(recent) < 3:
            return {
                'stress_level': 'insufficient_data',
                'score': 0,
                'signals': ['Not enough recent data to analyze'],
                'recommendations': ['Keep tracking your spending for better insights']
            }
        
        # Detect patterns
        signals = []
        score = 0
        
        # 1. Late-night spending
        late_night = self._detect_late_night_spending(recent)
        if late_night['detected']:
            signals.append(late_night)
            score += late_night['severity']
        
        # 2. High-frequency ordering
        high_freq = self._detect_high_frequency_spending(recent)
        if high_freq['detected']:
            signals.append(high_freq)
            score += high_freq['severity']
        
        # 3. Food delivery spikes
        food_spike = self._detect_food_spikes(recent, transactions)
        if food_spike['detected']:
            signals.append(food_spike)
            score += food_spike['severity']
        
        # 4. Balance decline
        balance_decline = self._detect_balance_decline(transactions)
        if balance_decline['detected']:
            signals.append(balance_decline)
            score += balance_decline['severity']
        
        # 5. Chaotic timing
        chaotic_timing = self._detect_chaotic_timing(recent)
        if chaotic_timing['detected']:
            signals.append(chaotic_timing)
            score += chaotic_timing['severity']
        
        # 6. Category concentration
        concentration = self._detect_category_concentration(recent)
        if concentration['detected']:
            signals.append(concentration)
            score += concentration['severity']
        
        # Determine stress level
        stress_level = self._calculate_stress_level(score)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(signals, stress_level)
        
        return {
            'stress_level': stress_level,
            'score': score,
            'signals': signals,
            'recommendations': recommendations,
            'analysis_period': f'Last {days} days',
            'transactions_analyzed': len(recent)
        }
    
    def _detect_late_night_spending(self, transactions: List) -> Dict:
        """Detect spending between 9 PM and 6 AM"""
        late_night_count = 0
        late_night_txns = []
        
        for txn in transactions:
            # Parse date to check time (if available)
            # For now, check for food orders which are often late-night
            if txn.category in ['Food', 'Coffee'] and 'delivery' in txn.description.lower():
                late_night_count += 1
                late_night_txns.append(txn.description)
        
        if late_night_count >= 2:
            return {
                'detected': True,
                'type': 'late_night_spending',
                'severity': 15,
                'count': late_night_count,
                'message': f'🌙 {late_night_count} late-night food orders detected',
                'details': late_night_txns[:3]
            }
        
        return {'detected': False}
    
    def _detect_high_frequency_spending(self, transactions: List) -> Dict:
        """Detect multiple transactions per day"""
        daily_counts = {}
        
        for txn in transactions:
            date = txn.date
            daily_counts[date] = daily_counts.get(date, 0) + 1
        
        high_days = [date for date, count in daily_counts.items() 
                     if count >= self.HIGH_FREQUENCY_THRESHOLD]
        
        if len(high_days) >= 2:
            max_count = max(daily_counts.values())
            return {
                'detected': True,
                'type': 'high_frequency',
                'severity': 20,
                'high_days': len(high_days),
                'max_per_day': max_count,
                'message': f'⚡ {len(high_days)} days with {self.HIGH_FREQUENCY_THRESHOLD}+ transactions',
                'details': f'Peak: {max_count} transactions in one day'
            }
        
        return {'detected': False}
    
    def _detect_food_spikes(self, recent: List, all_transactions: List) -> Dict:
        """Detect increased food spending"""
        # Get food spending in recent period
        recent_food = sum(t.amount for t in recent if t.category == 'Food')
        
        # Get historical average (previous period)
        days = 7
        cutoff = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        prev_cutoff = (datetime.now() - timedelta(days=days*2)).strftime('%Y-%m-%d')
        
        previous = [t for t in all_transactions 
                   if prev_cutoff <= t.date < cutoff and t.type == 'debit' and t.category == 'Food']
        
        if previous:
            prev_food = sum(t.amount for t in previous)
            
            if prev_food > 0:
                increase = (recent_food - prev_food) / prev_food
                
                if increase > self.SPIKE_THRESHOLD:
                    return {
                        'detected': True,
                        'type': 'food_spike',
                        'severity': 25,
                        'increase_percent': int(increase * 100),
                        'recent_amount': recent_food,
                        'previous_amount': prev_food,
                        'message': f'🍕 Food spending up {int(increase * 100)}% vs previous week',
                        'details': f'${recent_food:.2f} now vs ${prev_food:.2f} before'
                    }
        
        return {'detected': False}
    
    def _detect_balance_decline(self, transactions: List) -> Dict:
        """Detect declining balance trend"""
        if len(transactions) < 5:
            return {'detected': False}
        
        # Calculate running balance
        balances = []
        balance = 0
        
        for txn in sorted(transactions, key=lambda x: x.date):
            if txn.type == 'credit':
                balance += txn.amount
            else:
                balance -= txn.amount
            balances.append(balance)
        
        if len(balances) < 5:
            return {'detected': False}
        
        # Check if declining
        recent_avg = statistics.mean(balances[-3:])
        earlier_avg = statistics.mean(balances[:3])
        
        if earlier_avg > 0:
            decline = (earlier_avg - recent_avg) / earlier_avg
            
            if decline > self.BALANCE_DECLINE_THRESHOLD:
                return {
                    'detected': True,
                    'type': 'balance_decline',
                    'severity': 30,
                    'decline_percent': int(decline * 100),
                    'current_balance': recent_avg,
                    'message': f'📉 Balance declined {int(decline * 100)}%',
                    'details': f'From ${earlier_avg:.2f} to ${recent_avg:.2f}'
                }
        
        return {'detected': False}
    
    def _detect_chaotic_timing(self, transactions: List) -> Dict:
        """Detect irregular transaction patterns"""
        if len(transactions) < 4:
            return {'detected': False}
        
        # Calculate time gaps between transactions
        sorted_txns = sorted(transactions, key=lambda x: x.date)
        dates = [datetime.strptime(t.date, '%Y-%m-%d') for t in sorted_txns]
        
        gaps = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
        
        if len(gaps) < 3:
            return {'detected': False}
        
        # Check for high variance
        if len(set(gaps)) >= len(gaps) * 0.8:  # 80% unique gaps
            avg_gap = statistics.mean(gaps)
            return {
                'detected': True,
                'type': 'chaotic_timing',
                'severity': 10,
                'message': '⏱️ Irregular spending pattern detected',
                'details': f'Inconsistent transaction timing (avg {avg_gap:.1f} days apart)'
            }
        
        return {'detected': False}
    
    def _detect_category_concentration(self, transactions: List) -> Dict:
        """Detect over-concentration in one category"""
        category_totals = {}
        total = 0
        
        for txn in transactions:
            category_totals[txn.category] = category_totals.get(txn.category, 0) + txn.amount
            total += txn.amount
        
        if total == 0:
            return {'detected': False}
        
        # Find dominant category
        max_category = max(category_totals, key=category_totals.get)
        max_percent = (category_totals[max_category] / total) * 100
        
        if max_percent > 60:  # Over 60% in one category
            return {
                'detected': True,
                'type': 'category_concentration',
                'severity': 15,
                'category': max_category,
                'percent': int(max_percent),
                'message': f'📊 {int(max_percent)}% of spending on {max_category}',
                'details': f'${category_totals[max_category]:.2f} out of ${total:.2f}'
            }
        
        return {'detected': False}
    
    def _calculate_stress_level(self, score: int) -> str:
        """Convert score to stress level"""
        if score == 0:
            return 'none'
        elif score < 30:
            return 'low'
        elif score < 60:
            return 'moderate'
        elif score < 90:
            return 'high'
        else:
            return 'critical'
    
    def _generate_recommendations(self, signals: List, stress_level: str) -> List[str]:
        """Generate personalized recommendations"""
        recommendations = []
        
        # Get signal types
        signal_types = [s['type'] for s in signals if s.get('detected')]
        
        if 'late_night_spending' in signal_types:
            recommendations.append("🌙 Prep meals in advance to avoid late-night orders")
        
        if 'high_frequency' in signal_types:
            recommendations.append("📅 Plan your week's purchases to reduce impulse buying")
        
        if 'food_spike' in signal_types:
            recommendations.append("🍽️ Consider a meal plan or batch cooking to save money")
        
        if 'balance_decline' in signal_types:
            recommendations.append("💰 Set a weekly spending limit to stabilize your balance")
        
        if 'chaotic_timing' in signal_types:
            recommendations.append("⏰ Create a consistent spending schedule")
        
        if 'category_concentration' in signal_types:
            recommendations.append("📊 Diversify spending - you're too focused on one category")
        
        # General advice based on stress level
        if stress_level == 'high' or stress_level == 'critical':
            recommendations.append("⚠️ Your spending pattern matches high-stress weeks - consider talking to a campus counselor")
            recommendations.append("🧘 Take breaks and manage stress before it affects your budget")
        elif stress_level == 'moderate':
            recommendations.append("✅ Stay organized and plan ahead to reduce financial stress")
        
        if not recommendations:
            recommendations.append("✨ Your spending looks healthy! Keep it up!")
        
        return recommendations