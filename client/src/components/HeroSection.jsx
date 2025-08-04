import React from 'react'
import { assets } from '../assets/assets'
import { ArrowRight, CalendarIcon, ClockIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const HeroSection = () => {

    const navigate = useNavigate()

  return (
    <div className='flex flex-col items-start justify-center gap-4 px-6 md:px-16 lg:px-36 bg-[url("/background.jpg")] bg-cover bg-center h-screen'>

      {/* <img src={assets.marvelLogo} alt="" className="max-h-11 lg:h-11 mt-20"/> */}

      <h1 className='text-5xl mt-30 md:text-[70px] md:leading-18 font-semibold max-w-110'>Three <br /> Idiots</h1>

      <div className='flex items-center gap-4 text-gray-300'>
        <span>Comedy | Drama</span>
        <div className='flex items-center gap-1'>
            <CalendarIcon className='w-4.5 h-4.5'/> 2009
        </div>
        <div className='flex items-center gap-1'>
            <ClockIcon className='w-4.5 h-4.5'/> 2h 50m
        </div>
      </div>
      <p className='max-w-md text-gray-300'>The trio start their journey to find him where flashback revels Rancho, Raju and Farhan were engineering students and Rancho always believed that a person should be capable rather then being a bookworm and it will be way to success. He always got in tiff with Chatur and college director Viru Sahastrabuddhe (Virus) but fell in love with his daughter Pia. </p>
      <button onClick={()=> navigate('/movies')} className='flex items-center gap-1 px-6 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'>
         Explore Movies
         <ArrowRight className="w-5 h-5"/>
      </button>
    </div>
  )
}

export default HeroSection
