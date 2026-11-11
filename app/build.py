"""Genera index.html insertando engine.js en app.src.html."""
src = open('app.src.html', encoding='utf-8').read()
eng = open('engine.js', encoding='utf-8').read().replace("if (typeof module !== 'undefined') module.exports = Sesenta;", "")
open('index.html', 'w', encoding='utf-8').write(src.replace('/*ENGINE*/', eng))
