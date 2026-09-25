# Representative New Problems and Solutions

## Exact irrational rationalizing limit

Problem: `lim_(x->3) (sqrt(x)-sqrt(3))/(x-3)`

Solution: Multiply by the conjugate `sqrt(x)+sqrt(3)`. The numerator becomes `x-3`, so the common factor cancels for nearby `x != 3`. The remaining expression is `1/(sqrt(x)+sqrt(3))`, which approaches `1/(2sqrt(3)) = sqrt(3)/6`. Either exact form is accepted.

## Sum of cubes

Problem: `lim_(x->-a) (x^3+a^3)/(x+a)`

Solution: Factor `x^3+a^3=(x+a)(x^2-ax+a^2)`. Cancel `x+a`, then substitute `x=-a`: `a^2+a^2+a^2=3a^2`.

## GCF followed by another factorization

Problem: `lim_(x->r) (Ax^3-Ar^2x)/(x-r)`

Solution: Factor the numerator as `Ax(x^2-r^2)=Ax(x-r)(x+r)`. Cancel `x-r`, then substitute `x=r`: `A(r)(2r)=2Ar^2`.

## Eighth-root substitution

Problem form: `lim_(x->a) (root(8,mx+b)-k)/(x-a)`, where `k^8=ma+b`.

Solution: Let `u=root(8,mx+b)`, so `u->k` and `u^8-k^8=m(x-a)`. Replace `x-a` by `(u^8-k^8)/m`, factor the difference of eighth powers, and cancel `u-k`. The seven-power sum approaches `8k^7`, giving `m/(8k^7)`.

## Polynomial ratio after cube-root substitution

Problem form: a quotient whose numerator is `(cbrt(x)-k)(cbrt(x)-r)` and denominator is `(cbrt(x)-k)(cbrt(x)-s)`, displayed in expanded form, as `x->k^3`.

Solution: Let `u=cbrt(x)`, so `u->k`. Factor both quadratics in `u`, cancel `u-k`, check that `k-s` is nonzero, and evaluate `(k-r)/(k-s)`.

## Complex fraction with two variable-dependent fractions

Problem: `lim_(x->3) [2/(x^2+1)-1/(x+2)]/(x-3)`.

Solution: Combine the numerator over `(x^2+1)(x+2)`. Its numerator is `2(x+2)-(x^2+1)=-(x-3)(x+1)`. Cancel `x-3` from the full quotient. Substituting `x=3` into `-(x+1)/[(x^2+1)(x+2)]` gives `-4/(10*5)=-2/25`.

## Graph interpretation sequence

For a generated multi-feature graph, the engine separately asks for the point value, both one-sided limits, the two-sided limit, continuity, a true/false interpretation, the applicable one-sided endpoint limit, and the two-sided endpoint limit. Explanations identify the relevant branch or filled point. Under the course convention, a finite-domain endpoint can be continuous using its applicable one-sided limit, while its two-sided limit is DNE because the other side is absent.

