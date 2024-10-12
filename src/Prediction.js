import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

function Prediction() {
  const [soilType, setSoilType] = useState('');
  const [climate, setClimate] = useState('');
  const [cropType, setCropType] = useState('');
  const [rainfall, setRainfall] = useState('');
  const [temperature, setTemperature] = useState('');
  const [language, setLanguage] = useState('en');
  const [recommendation, setRecommendation] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [image, setImage] = useState(null);

  // Function to handle prediction generation
  const getPrediction = async () => {
    let query = `Soil type: ${soilType || 'unknown'}, Climate: ${climate || 'unknown'}`;
    if (cropType.trim()) query += `, Crop: ${cropType}`;
    if (rainfall.trim()) query += `, Rainfall: ${rainfall}`;
    if (temperature.trim()) query += `, Temperature: ${temperature}`;

    let languagePrompt = language === 'hi'
      ? `Provide recommendations based on the following inputs in Hindi: ${query}.`
      : `Provide recommendations based on the following inputs in English: ${query}.`;

    try {
      const genAI = new GoogleGenerativeAI("AIzaSyDo0eD4kH-FMGIa6mrr29TodxlqB5RFfzk");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // If an image is uploaded, analyze it
      if (image) {
        const formData = new FormData();
        formData.append('image', image);

        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const imageAnalysis = await response.json();
          query += `, Image analysis: ${imageAnalysis.details}`;
        } else {
          console.error('Image analysis failed.');
        }
      }

      // Generate recommendation based on inputs
      const result = await model.generateContent(`
        ${languagePrompt}
        Provide recommendations in simple language for farmers:
        1. Start with the crop name that is suitable for the conditions.
        2. Mention the exact fertilizer required.
        3. Use simple sentences and direct instructions.
        4. Include any other farming tips, but keep them in separate paragraphs.
      `);

      const prediction = await result.response.text();
      const formattedPrediction = prediction
        .replace(/\*/g, '')
        .replace(/\#/g, '')
        .replace(/(Suitable Crop:)/g, '<br><b>$1</b>')
        .replace(/(Fertilizer:)/g, '<br><br><b>$1</b>')
        .replace(/(Additional Tips:)/g, '<br><b>$1</b>');

      setRecommendation(formattedPrediction);

      // LimeWire Image Generation
      const imageResponse = await fetch('https://api.limewire.com/api/image/generation', {
        mode: 'no-cors',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Version': 'v1',
          Accept: 'application/json',
          'Authorization': `Bearer lmwr_sk_cdDAV1VASv_FphzM3uRo8nWVqbrCDbLy4wV5Z2JdvzaDkHnn`
        },
        body: JSON.stringify({
          prompt: `A farmland scenario with crops based on the following conditions: ${query}`,
          aspect_ratio: '1:1'
        })
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        setGeneratedImageUrl(imageData.url);
      } else {
        console.error('Failed to generate image from LimeWire API.');
      }
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      setRecommendation('Error generating prediction. Please try again later.');
    }
  };

  // Function to handle going back to the form
  const handleBack = () => {
    setIsSubmitted(false);
  };

  // Function to handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  return (
    <section className="main d-flex align-items-center text-white">
      <div className="container align-items-center justify-content-center d-flex flex-column gap-2">
        <div className="text-center">
          <h1>Agri AI - Crop / Fertilizer Predictor</h1>
        </div>

        {!isSubmitted && (
          <div id="user-input" className="form">
            <div id="language-select">
              <label htmlFor="language">Select Language:</label>
              <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>

            <label htmlFor="soil-type">Soil Type (optional):</label>
            <input
              type="text"
              id="soil-type"
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              placeholder="e.g., Loamy, Clay"
            /><br />

            <label htmlFor="climate">Climate (optional):</label>
            <input
              type="text"
              id="climate"
              value={climate}
              onChange={(e) => setClimate(e.target.value)}
              placeholder="e.g., Tropical, Arid"
            /><br />

            <label htmlFor="crop-type">Crop Type (optional):</label>
            <input
              type="text"
              id="crop-type"
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              placeholder="e.g., Wheat, Rice"
            /><br />

            <label htmlFor="rainfall">Rainfall (in mm, optional):</label>
            <input
              type="text"
              id="rainfall"
              value={rainfall}
              onChange={(e) => setRainfall(e.target.value)}
              placeholder="e.g., 500mm"
            /><br />

            <label htmlFor="temperature">Temperature (in °C, optional):</label>
            <input
              type="text"
              id="temperature"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="e.g., 25°C"
            /><br />

            <label htmlFor="image">Upload Image (optional):</label>
            <input
              type="file"
              id="image"
              onChange={handleImageChange}
              accept="image/*"
            /><br />

            <button id="recommendationBtn" className="btn btn-success" onClick={getPrediction}>
              Get Prediction
            </button>
          </div>
        )}

        {isSubmitted && (
          <div id="recommendation">
            <div dangerouslySetInnerHTML={{ __html: recommendation }} />
            {generatedImageUrl && <img src={generatedImageUrl} alt="Generated Farming Scenario" />}
            <button className="btn btn-primary mt-3" onClick={handleBack}>
              Back to Form
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default Prediction;
