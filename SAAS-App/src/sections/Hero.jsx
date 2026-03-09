import React from 'react'
import { Element, Link as LinkScroll } from 'react-scroll'
import Button from '../components/Button'

const Hero = () => {
  return (
    <section className='relative pt-60 pb-40 max-lg:pt-53 max-lg:pb-36 
    max-md:pt-36 max-md:pb-32 border-2 border-amber-400'>
            <Element name="hero">
                <div className="container">
                    <div className='relative z-2 max-w-512 max-lg:max-w-388'>
                        <div className='caption small-2 uppercase text-p3'>
                            Video Editing
                        </div>
                        <h1 className='mb-6 h1 text-p4 uppercase max-lg:mb-7 max-lg:h2
                        max-md:mb-4 max-md:text-5xl max-md:leading-12'>
                            Create Videos with Ease
                        </h1>
                        <p className='max-w-440 mb-14 body-1 max-md:mb-10'>
                            we designed XORA AI to be the most intuitive and 
                            user-friendly video editing software on the market. 
                            With our powerful AI technology, you can create stunning videos in minutes, 
                            without any prior experience or technical skills. 
                        </p>
                        <LinkScroll to="features" offset={-100} spy smooth>
                            <Button  icon="/images/zap.svg">
                                Try Now
                            </Button>
                        </LinkScroll>

                    </div>
                </div>
            </Element>
    </section>
  )
}

export default Hero