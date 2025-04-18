from flask import Flask
import yfinance as yf

app = Flask(__name__)

@app.route('/')
def index():
    return f"yfinance version: {yf.__version__}"

if __name__ == '__main__':
    app.run(debug=True)

