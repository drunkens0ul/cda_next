import { memo } from 'react'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Sponsors from '@/components/Sponsors'
import Events from '@/components/Events'
import About from '@/components/About'
import StrategicMission from '@/components/StrategicMission'
import MissionCards from '@/components/MissionCards'
import JoinMovement from '@/components/JoinMovement'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'

function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <JoinMovement />
      {/* <Events /> */}
      <About />
      <StrategicMission />
      <MissionCards />
      <Sponsors />
      <Contact />
      <Footer />
    </div>
  )
}

export default memo(Home)
