import numpy as np
from scipy.optimize import minimize
from typing import Dict, List, Tuple, Optional

ASSET_CLASSES = ['banking', 'bonds', 'mutual_funds', 'gold', 'stocks']

# Risk-Tier Bounds (enforcing continuous regulatory guardrails - Paper 7)
TIER_BOUNDS = {
    'conservative': {
        'banking': (0.30, 0.60),
        'bonds': (0.20, 0.40),
        'mutual_funds': (0.10, 0.25),
        'gold': (0.05, 0.15),
        'stocks': (0.02, 0.10)
    },
    'moderate': {
        'banking': (0.10, 0.30),
        'bonds': (0.10, 0.30),
        'mutual_funds': (0.20, 0.40),
        'gold': (0.05, 0.15),
        'stocks': (0.15, 0.35)
    },
    'aggressive': {
        'banking': (0.02, 0.10),
        'bonds': (0.05, 0.20),
        'mutual_funds': (0.20, 0.40),
        'gold': (0.05, 0.20),
        'stocks': (0.30, 0.55)
    }
}

# Empirical fallback defaults if optimization fails to converge
FALLBACK_DEFAULTS = {
    'conservative': {
        'banking': 0.45,
        'bonds': 0.25,
        'mutual_funds': 0.15,
        'gold': 0.10,
        'stocks': 0.05
    },
    'moderate': {
        'banking': 0.20,
        'bonds': 0.15,
        'mutual_funds': 0.30,
        'gold': 0.10,
        'stocks': 0.25
    },
    'aggressive': {
        'banking': 0.05,
        'bonds': 0.05,
        'mutual_funds': 0.35,
        'gold': 0.05,
        'stocks': 0.50
    }
}

class ContinuousPortfolioOptimizer:
    """
    Continuous Markowitz Mean-Variance Numerical Optimizer using SciPy SLSQP (Paper 7).
    Dynamically optimizes Sharpe Ratio across 5 asset classes under risk-tier regulatory bounds.
    """
    def __init__(self, risk_free_rate: float = 0.07):
        self.rf = risk_free_rate  # 7.0% RBI Benchmark
        self.asset_classes = ASSET_CLASSES
        
        # Expected annualized returns mu for asset classes: [FD, Bonds, MF, Gold, Stocks]
        self.mu = np.array([0.0725, 0.0680, 0.1250, 0.0950, 0.1600])
        
        # Standard annualized asset volatilities
        self.volatilities = np.array([0.005, 0.040, 0.140, 0.110, 0.180])
        
        # Historical correlation matrix
        self.correlation_matrix = np.array([
            [1.00,  0.15,  0.02,  0.00,  0.01],
            [0.15,  1.00,  0.20,  0.05,  0.15],
            [0.02,  0.20,  1.00, -0.05,  0.75],
            [0.00,  0.05, -0.05,  1.00, -0.10],
            [0.01,  0.15,  0.75, -0.10,  1.00]
        ])
        
        # Covariance Matrix Sigma = D * Cor * D
        self.cov = np.outer(self.volatilities, self.volatilities) * self.correlation_matrix

    def _negative_sharpe(self, weights: np.ndarray) -> float:
        """Objective function: Minimize negative Sharpe ratio (-Sharpe)"""
        port_return = np.dot(weights, self.mu)
        port_vol = np.sqrt(np.dot(weights.T, np.dot(self.cov, weights)))
        if port_vol <= 1e-8:
            return 0.0
        return -(port_return - self.rf) / port_vol

    def optimize(self, risk_tier: str) -> Dict:
        """
        Solves continuous Markowitz allocation for given risk tier using SLSQP.
        """
        tier = risk_tier.lower().strip()
        if tier not in TIER_BOUNDS:
            tier = 'moderate'
            
        bounds_dict = TIER_BOUNDS[tier]
        bounds = [bounds_dict[asset] for asset in self.asset_classes]
        
        # Initial guess: Normalized midpoints of bounds
        midpoints = np.array([(b[0] + b[1]) / 2.0 for b in bounds])
        x0 = midpoints / np.sum(midpoints)
        
        # Budget constraint: Sum of weights == 1.0 (100% allocation)
        constraints = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0})
        
        try:
            res = minimize(
                self._negative_sharpe,
                x0,
                method='SLSQP',
                bounds=bounds,
                constraints=constraints,
                options={'ftol': 1e-9, 'maxiter': 500}
            )
            
            if res.success:
                raw_weights = np.clip(res.x, [b[0] for b in bounds], [b[1] for b in bounds])
                weights = raw_weights / np.sum(raw_weights)
                converged = True
            else:
                fallback = FALLBACK_DEFAULTS[tier]
                weights = np.array([fallback[asset] for asset in self.asset_classes])
                converged = False
        except Exception as e:
            print(f"SLSQP Optimization warning for tier {risk_tier}: {e}. Using empirical fallback.")
            fallback = FALLBACK_DEFAULTS[tier]
            weights = np.array([fallback[asset] for asset in self.asset_classes])
            converged = False

        port_return = float(np.dot(weights, self.mu))
        port_vol = float(np.sqrt(np.dot(weights.T, np.dot(self.cov, weights))))
        sharpe = (port_return - self.rf) / port_vol if port_vol > 0 else 0.0
        
        weights_dict = {asset: float(w) for asset, w in zip(self.asset_classes, weights)}
        weights_percent = {asset: round(float(w * 100.0), 2) for asset, w in zip(self.asset_classes, weights)}
        
        # Ensure percentages sum to exactly 100.0 by adjusting largest allocation
        diff = round(100.0 - sum(weights_percent.values()), 2)
        if abs(diff) > 0.001:
            max_key = max(weights_percent, key=weights_percent.get)
            weights_percent[max_key] = round(weights_percent[max_key] + diff, 2)

        return {
            "tier": tier,
            "weights": weights_dict,
            "weights_percent": weights_percent,
            "expected_return": port_return,
            "expected_return_percent": round(port_return * 100.0, 2),
            "portfolio_volatility": port_vol,
            "sharpe_ratio": round(sharpe, 4),
            "converged": converged
        }

    def get_category_allocations(self, risk_tier: str) -> Dict[str, float]:
        """Returns percentage splits (summing to 100.0) compatible with recommendation engine"""
        opt_res = self.optimize(risk_tier)
        return opt_res["weights_percent"]

# Default singleton instance
continuous_optimizer = ContinuousPortfolioOptimizer()

def optimize_portfolio(risk_tier: str) -> Dict:
    """Convenience wrapper for portfolio optimization"""
    return continuous_optimizer.optimize(risk_tier)
