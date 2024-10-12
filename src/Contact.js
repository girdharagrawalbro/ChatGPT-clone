import React from 'react';
const Contact = () => {
  const teamMembers = [
    {
      name: 'Girdhar Agrawal (Team Leader)',
      role: 'Full Stack Developer',
      image: '/images/profile.jpeg',
      description: 'Specialized in Frotend & Backend Development.',
    },
    {
      name: 'Vyom Sahu',
      role: 'UI / UX Designer',
      image: '/images/profile.jpeg',
      description: 'Expert in Web Designing and Figma.',
    },
    {
      name: 'Astha Kesharwani',
      role: 'Presenter',
      image: '/images/profile.jpeg',
      description: 'Good Communication Skill',
    },
    {
      name: 'Aditi Rajesh Nair',
      role: 'Presenter',
      image: '/images/profile.jpeg',
      description: 'Good Communication Skill',
    },
  ];
  return (
    <>
      <section className="main d-flex  align-items-center text-white flex-wrap">
        <div className="container">
          <div className="container text-center">
            <h2 className="text-center mb-4">Meet the team of Code Avengers </h2>
          </div>
          <div className="container">
            <div className="row d-flex flex-wrap">
              {teamMembers.map((member, index) => (
                <div className="col-md-3" key={index}>
                  <div className="card bg-dark text-white">
                    <img
                      src={member.image}
                      className="card-img-top"
                      alt={`${member.name}'s profile`}
                    />
                    <div className="card-body">
                      <h5 className="card-title">{member.name}</h5>
                      <p className="card-text">{member.role}</p>
                      <p className="card-text">{member.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
export default Contact;
