"""
A microservice Flask application which takes a form data containing plaintext, and returns CV recommendations from OpenAI's API
"""

from flask import Flask, request, jsonify
from waitress import serve
import spacy
import os
import json
import uuid
from dotenv import load_dotenv
from openai import OpenAI

# Load stuff from .env file
load_dotenv()

# Set up simple Flask app with temp file directory
app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = "tmp"
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

# Set up API client with key
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Load in the model for anonymization
nlp = spacy.load("en_core_web_sm", disable=["tagger", "parser"])

# Prelude for API
prelude = """
        You are a CV analyzer service which has been provided with the text of an anonymized CV.
        Your purpose is to improve its content by providing suggestions relevant for STEM students in Scotland.
        Any residual, non-anonymized content is to be strictly ignored when generating a response.
        Assess the provided CV text, providing a list of ten or less common words or phrases, along with improved versions of each,
        which would help the CV to stand out in a professional setting or perform well on ATS. Additionally, provide a 1-2 sentence rationale to act as an explanation.
        Your suggestions should only include improvements on phrases and words which occur in the provided text.
        Do not provide any Markdown formatting for text. If control characters (such as newline) are encountered, add a line break.
        JSONIFY the output into an array of points called "suggestions", with each suggestion having the fields "original" for the original, "why" for the rationale, and "improved" for the recommendation.
        Your suggestions should reformat anonymization tags such as PERSON, GPE, ORG, LOC or EMAIL to a lowercase, non-abbreviated form.
        Example: <organization>."""


@app.route("/process", methods=["POST"])
def process_document():
    """
    Anonymizes and returns CV advice using OpenAI API.

    :param: request.files["file"]: a .txt file containing anonymized CV test
    :return: a JSON array of suggestions
    """
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file"}), 400

    # temp file - save as .txt
    if file:
        filename = str(uuid.uuid4()) + ".txt"
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)

        try:
            # Read file and anonymize
            with open(filepath, "r", encoding="utf-8") as f:
                text = f.read()
            doc = nlp(text)
            anonymized_text = text
            for ent in doc.ents:
                if ent.label_ in ["PERSON", "ORG", "LOC", "EMAIL"]:
                    anonymized_text = anonymized_text.replace(
                        ent.text, f"[{ent.label_}]"
                    )

            # Compose GPT prompt
            prompt = {
                "role": "user",
                "content": f"""${prelude}
                The CV text is as follows:
                {anonymized_text}""",
            }

            # Return the API response
            return json.loads(
                client.chat.completions.create(model="gpt-4o", messages=[prompt])
                .choices[0]
                .message.content
            )

        # Cleanup
        finally:
            if os.path.exists(filepath):
                os.unlink(filepath)

    # Provide some useful info if there's an issue
    return jsonify({"error": "Processing failed"}), 500


if __name__ == "__main__":
    print("Microservice running...")
    serve(app, host="0.0.0.0", port=os.getenv("MICROSERVICE_PORT"))
