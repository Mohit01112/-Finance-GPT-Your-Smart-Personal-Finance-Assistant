from flask import Flask, render_template, request, jsonify
from chatbot import chat_with_gpt
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        user_message = request.json.get('message')
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        # Create the messages array with system prompt and user message
        messages = [
            {
                "role": "system",
                "content": (
                    "You are FINANCE-GPT, an expert financial assistant. "
                    "Your job is to answer EVERY question strictly from a finance perspective. "
                    "You must give clear, accurate, and complete explanations. "
                    "If the user asks anything (math, coding, theory, real-life advice), "
                    "you must answer it in terms of FINANCE. "
                    "You specialize in: personal finance, budgeting, investing, stock markets, "
                    "cryptocurrency, banking, credit scores, mutual funds, trading strategies, "
                    "insurance, taxation, loans, financial planning, and fintech. "
                    "Never refuse any question. Always give useful financial guidance. "
                    "IMPORTANT: Never include code blocks unless the user directly requests them. "
                    "Default to plain-language explanations, bullet points, steps, and formulas in plain text. "
                    "Only provide code (Python, JavaScript, etc.) when the user explicitly asks for it using words like: 'code', 'example in python', 'write a function', 'code snippet', 'show program', 'give code', or similar explicit requests. "
                    "For normal questions, explain concepts, formulas, and calculations in words and mathematical notation, NOT in code blocks. "
                    "When presenting lists of stocks, companies, top items, or recommendations, always format the answer as a clear, numbered list (like: 1. Apple, 2. Google, etc.), with each item neatly on its own line for easy reading."
                )
            },
            {
                "role": "user",
                "content": user_message
            }
        ]
        
        # Get response from OpenAI
        response = chat_with_gpt(messages)
        return jsonify({'response': response})
    
    except Exception as e:
        # Log the error for debugging
        print(f"Error processing request: {str(e)}")
        # Return a user-friendly error message
        return jsonify({'response': f"Sorry, I encountered an error: {str(e)}"}), 500

if __name__ == '__main__':
    # Get port from environment variable or default to 5000
    port = int(os.environ.get('PORT', 5000))
    # Use 0.0.0.0 as host for production deployments
    app.run(debug=False, host='0.0.0.0', port=port)
