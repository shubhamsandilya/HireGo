// import React from "react";
import { AiOutlineSearch, AiOutlineCloseCircle } from "react-icons/ai";
import { CiLocationOn } from "react-icons/ci";
import CustomButton from "./CustomButton";
import { popularSearch } from "../utils/data";
import { HeroImage } from "../assets";

const SearchInput = ({ placeholder, icon, value, setValue, styles }) => {
  const handleChange = (e) => {
    setValue(e.target.value);
  };

  const clearInput = () => setValue("");

  return (
    <div className={`flex items-center ${styles}`}>
      {icon}
      <input
        value={value}
        onChange={(e) => handleChange(e)}
        type="text"
        className="w-full p-3 bg-gray-100 border-b border-gray-300 focus:outline-none focus:border-blue-600 rounded-tl-lg rounded-bl-lg"
        placeholder={placeholder}
      />
      {value && (
        <AiOutlineCloseCircle
          className="text-gray-600 text-lg cursor-pointer ml-2"
          onClick={clearInput}
        />
      )}
    </div>
  );
};

const Header = ({
  title,
  type,
  handleClick,
  searchQuery,
  setSearchQuery,
  location,
  setLocation,
}) => {
  return (
    <div className="bg-gray-100 py-10 md:py-16">
      <div className="container mx-auto px-5 md:px-0">
        <div className="bg-white rounded-lg shadow-lg md:flex items-center">
          <div className="md:w-1/2 p-6 md:p-10">
            <h1 className="text-3xl md:text-4xl font-bold text-center md:text-left text-blue-600 mb-4">
              {title}
            </h1>
            <div className="md:flex items-center justify-center md:justify-start">
              <SearchInput
                placeholder="Job Title or Keywords"
                icon={<AiOutlineSearch className="text-gray-600 text-lg" />}
                value={searchQuery}
                setValue={setSearchQuery}
                styles="md:mr-2 w-full md:w-auto mb-4 md:mb-0"
              />
              <SearchInput
                placeholder="Add Country or City"
                icon={<CiLocationOn className="text-gray-600 text-lg" />}
                value={location}
                setValue={setLocation}
                styles="md:ml-2 w-full md:w-auto"
              />
            </div>
            <CustomButton
              onClick={handleClick}
              title="Search"
              containerStyles="mt-4 md:mt-6 w-full md:w-auto focus:outline-none bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-full md:rounded-md text-sm "
            />
          </div>
          <div className="hidden md:block md:w-1/2 relative">
            <img
              src={HeroImage}
              alt="Hero"
              width={25}
              height={25}
              className="object-cover ml-[150px] w-1/2 h-1/2 rounded-lg"
            />
          </div>
        </div>
        {type && (
          <div className="mt-8 md:mt-12 flex flex-wrap justify-center md:justify-start gap-3 md:gap-6">
            {popularSearch.map((search, index) => (
              <span
                key={index}
                className="bg-blue-200 text-blue-600 py-2 px-4 rounded-full text-sm md:text-base"
              >
                {search}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
