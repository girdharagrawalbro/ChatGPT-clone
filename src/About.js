import React from 'react'
const About = () => {
  return (
    <>
      <section className="main d-flex align-items-center text-white flex-wrap">
        <div className="container">
          <h1 className=' text-center'>About</h1>
          <div className='bg-dark-50 text-light p-3 rounded shadow'>
          <h4>Our Problem Statement - </h4>
          <p>Agriculture is struggling to meet growing food demands, but at a severe environmental cost.Excessive water use, overworked land, and rampant chemical use are depleting soil fertility,contaminating water, and reducing biodiversity. Climate change and population growth areworsening these issues, making conventional farming methods unsustainable
          </p>
          <br />
          <h4>Technology - </h4>
          <p>Generative AI offers a solution by optimizing resource management. With AI, farms canprecisely control water, minimize chemical use, and restore soil health. This approach promisessmarter, more sustainable agriculture that works in harmony with nature, ensuring long-termproductivity.</p>
          <br />
          <h4>Proposed Solution - </h4>
          <p>
            We propose a Generative AI system that:
            Predicts the best crop to plant based on soil data, date, and climate conditions.
            Recommends the right fertilizer by analyzing soil health and nutrient requirements.
            Optimizes resource use by providing precise advice, reducing overuse of water andchemicals.
            Supports sustainable farming by improving yields while minimizing environmental impact.
            This AI-driven system enables farmers to make smarter, data-based decisions for moreefficient and eco-friendly agriculture
          </p>
        </div>
        </div>
      </section>
    </>
  )
}
export default About