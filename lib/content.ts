export const PLATE_PY = `import sympy as sp

# Plate temperature (deg C), |x|,|y| <= 1.5 m
x, y = sp.symbols('x y', real=True)
T = 50 + x**3 - 3*x - y**3 + 3*y

# Critical points: grad T = 0
pts = sp.solve([sp.diff(T, x), sp.diff(T, y)],
               [x, y], dict=True)

# Second derivative test
fxx, fyy = sp.diff(T, x, 2), sp.diff(T, y, 2)
fxy = sp.diff(T, x, y)
for p in pts:
    D = (fxx*fyy - fxy**2).subs(p)
    a = fxx.subs(p)
    kind = ("saddle" if D < 0 else
            "min (cold)" if a > 0 else "max (hot)")
    print(f"({str(p[x]):>2},{str(p[y]):>2})"
          f"  D={str(D):>4}  T={T.subs(p)}  {kind}")
`;

export const PLATE_OUTPUT = `$ python plate.py
(-1,-1)  D= -36  T=50  saddle
(-1, 1)  D=  36  T=54  max (hot)
( 1,-1)  D=  36  T=46  min (cold)
( 1, 1)  D= -36  T=50  saddle`;

export const TEAM = [
  { name: "Mostafa Amr Mostafa", id: "2024015292" },
  { name: "Mohamed Salah Mohamed", id: "2024016048" },
  { name: "Mohamed Gomaa Hassan", id: "2024004388" },
  { name: "Fares Amer Mohamed", id: "2024024360" },
  { name: "Mohamed Ahmed Mohamed Ali", id: "2024012639" },
  { name: "Bassel Magdy Abdullah", id: "2024026551" },
  { name: "Fady Hany Sanad", id: "2024022538" },
  { name: "Omar Mohamed Fathy Mohamed", id: "2024037329" },
  { name: "Anas Mohamed Samir", id: "2025036173" },
  { name: "Motaz Anwer Younes", id: "2025014206" },
] as const;
