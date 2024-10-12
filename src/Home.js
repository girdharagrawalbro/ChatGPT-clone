import React from 'react'
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <section className="main d-flex align-items-center text-white flex-wrap">
            <div className="container d-flex flex-column gap-0">
                <h1 className="large-text">FARMING WITH <span className='mobile'>AI    </span> </h1>
                <div className="d-flex align-items-center px-1 m-0 flex-wrap">
                    <div>
                        <p className="m-0 desc">
                            This web application, <b>Agri AI - Crop/Fertilizer Predictor,</b>  is designed to assist farmers in making informed agricultural decisions. By inputting key information such as soil type, climate conditions, crop type, rainfall, and temperature, users can receive tailored recommendations on the most suitable crops to plant and the fertilizers to use. Additionally, the app supports image uploads for further analysis, allowing users to upload photos of soil or crops to enhance the prediction accuracy. With support for multiple languages and AI-generated advice, this tool helps farmers maximize their productivity and efficiency, using advanced technology to simplify farming.
                        </p>
                    </div>
                    <div>
                        <h1 className="text-ai m-0">AI</h1>
                    </div>
                </div>
                <br />
                <div className="d-flex gap-2 p-0 m-0">
                    <Link to="/prediction"><button className="btn btn-warning rounded-pill text-white">Crop / Fertilizer Recommendation</button></Link>

                </div>
            </div>
        </section>

    )
}

export default Home