from flask import Flask, render_template, request, jsonify
from PIL import Image
import pytesseract
import base64
import io
import datetime
import re

app = Flask(__name__)

# -----------------------------
# Windows: If you get TesseractNotFoundError, uncomment and set the correct path:
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
# -----------------------------

def _clean_command(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())

def _decode_data_url_image(data_url: str) -> Image.Image:
    """
    Input: data:image/png;base64,....
    Output: PIL Image (RGB)
    """
    if not data_url:
        raise ValueError("No image data provided")
    if "," in data_url:
        _, b64 = data_url.split(",", 1)
    else:
        b64 = data_url
    raw = base64.b64decode(b64)
    return Image.open(io.BytesIO(raw)).convert("RGB")


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/command")
def api_command():
    data = request.get_json(silent=True) or {}
    cmd = _clean_command(data.get("command", ""))

    if not cmd:
        return jsonify({"reply": "I didn't catch that. Please say a command again.", "action": "none", "payload": {}})

    if cmd in {"help", "what can you do", "commands"}:
        return jsonify({
            "reply": "You can say: help, read text, describe scene, what time is it, or open <something>.",
            "action": "none",
            "payload": {}
        })

    if "time" in cmd:
        now = datetime.datetime.now().strftime("%I:%M %p")
        return jsonify({"reply": f"The time is {now}.", "action": "none", "payload": {}})

    if cmd in {"read text", "read", "ocr", "read this"}:
        return jsonify({"reply": "Okay. Enable camera and press OCR Read.", "action": "request_ocr", "payload": {}})

    if cmd in {"describe scene", "describe", "what is in front of me", "what do you see"}:
        return jsonify({"reply": "Enable camera and press Describe Scene (demo).", "action": "request_describe", "payload": {}})

    if cmd.startswith("open "):
        target = cmd.replace("open ", "", 1).strip()
        if not target:
            return jsonify({"reply": "Say open followed by what you want to open.", "action": "none", "payload": {}})
        return jsonify({"reply": f"Opening {target}.", "action": "open", "payload": {"target": target}})

    return jsonify({"reply": f"You said: {cmd}. Say 'help' for commands.", "action": "none", "payload": {}})


@app.post("/api/ocr")
def api_ocr():
    data = request.get_json(silent=True) or {}
    image_data_url = data.get("imageDataUrl", "")

    try:
        img = _decode_data_url_image(image_data_url)
        text = pytesseract.image_to_string(img)
        clean = (text or "").strip()
        if not clean:
            return jsonify({"text": "", "reply": "I couldn't read any text. Try again with better lighting and focus."})
        return jsonify({"text": clean, "reply": "I have read the text. I will speak it now."})
    except Exception as e:
        return jsonify({"text": "", "reply": f"OCR failed: {str(e)}"}), 400


@app.post("/api/describe")
def api_describe():
    """
    Demo placeholder. Replace with object detection/captioning later.
    """
    data = request.get_json(silent=True) or {}
    image_data_url = data.get("imageDataUrl", "")

    try:
        _ = _decode_data_url_image(image_data_url)
        return jsonify({"reply": "Demo: I received the image. Add an object detection model to identify objects.", "objects": []})
    except Exception as e:
        return jsonify({"reply": f"Describe failed: {str(e)}", "objects": []}), 400


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
