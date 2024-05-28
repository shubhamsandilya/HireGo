import React from "react";
import { JobImg } from "../assets";

const About = () => {
  return (
    <div className="container mx-auto flex flex-col gap-8 2xl:gap-14 py-6 ">
      <div className="w-full flex flex-col-reverse md:flex-row gap-10 items-center p-5">
        <div className="w-full md:2/3 2xl:w-2/4">
          <h1 className="text-3xl text-blue-600 font-bold mb-5">About Us</h1>
          <p className="text-justify leading-7">
            Hirego is an innovative job portal dedicated to transforming the job
            search and hiring process. Our platform connects job seekers with
            potential employers, providing a seamless and efficient experience
            for both parties. We are committed to empowering individuals to find
            their dream jobs while enabling companies to discover top talent.
            Our Vision To be the leading job portal that redefines how people
            find jobs and companies recruit talent, fostering a more connected
            and efficient job market. Our Mission To simplify the hiring process
            through advanced technology and user-friendly features, ensuring
            that job seekers and employers can connect effortlessly and
            effectively. Our Values Innovation: Continuously improve our
            platform with cutting-edge technology and features. Integrity:
            Maintain honesty and transparency in all our operations.
            User-Centricity: Prioritize the needs and experiences of our users
            in every decision we make. Diversity and Inclusion: Foster an
            inclusive environment where everyone has equal opportunities.
          </p>
        </div>
        <img src={JobImg} alt="About" className="w-auto h-[300px]" />
      </div>

      <div className="leading-8 px-5 text-justify">
        <p>
          Hirego is powered by a dedicated team of professionals with expertise
          in technology, human resources, and customer service. Our team is
          committed to providing the best possible experience for our users,
          continuously working to enhance our platform and support our
          community. Contact Us For any inquiries or support, please contact us
          at: <br /> Email: shubhamsandilyadbg2@gmail.com <br /> Phone: +91
          8539999768
          <br /> Address: CRPF Square, Bhubaneshwar,Odisha <br /> Job Street,
          Employment City, EC 56789 Join Hirego today and take the next step
          towards your career goals or find the perfect candidate for your
          company. Together, we can make the job market more efficient and
          accessible for everyone.
        </p>
      </div>
    </div>
  );
};

export default About;
