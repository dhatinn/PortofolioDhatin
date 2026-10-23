import { MdArrowOutward, MdCopyright } from "react-icons/md";
import "./styles/Contact.css";
import { usePortfolio } from "../context/PortfolioContext";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

const Contact = () => {
  const { config, language } = usePortfolio();
  useEffect(() => {
    const contactTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".contact-section",
        start: "top 80%",
        end: "bottom center",
        toggleActions: "play none none none",
      },
    });

    // Animate title from bottom
    contactTimeline.fromTo(
      ".contact-section h3",
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
      }
    );

    // Animate contact boxes with stagger from bottom
    contactTimeline.fromTo(
      ".contact-box",
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: "power3.out",
      },
      "-=0.4"
    );

    // Clean up
    return () => {
      contactTimeline.kill();
    };
  }, []);

  return (
    <div className="contact-section section-container" id="contact">
      <div className="contact-container">
        <h3>{config.developer.fullName}</h3>
        <div className="contact-flex">
          <div className="contact-box">
            <h4>Email</h4>
            <p>
              <a href={`mailto:${config.contact.email}`} data-cursor="disable">
                {config.contact.email}
              </a>
            </p>
            <h4>{language === "id" ? "Telepon / WhatsApp" : "Phone / WhatsApp"}</h4>
            <p>
              <a href={config.contact.whatsapp} target="_blank" rel="noopener noreferrer" data-cursor="disable">
                {config.contact.phone}
              </a>
            </p>
            <h4>{language === "id" ? "Lokasi" : "Location"}</h4>
            <p>
              <span>{config.social.location}</span>
            </p>
          </div>
          <div className="contact-box">
            <h4>{language === "id" ? "Media Sosial" : "Social"}</h4>
            {[
              { label: "Github", href: config.contact.github },
              { label: "WhatsApp", href: config.contact.whatsapp },
              { label: "Linkedin", href: config.contact.linkedin },
            ]
              .filter((s) => s.href)
              .map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="disable"
                  className="contact-social"
                >
                  {s.label} <MdArrowOutward />
                </a>
              ))}
          </div>
          <div className="contact-box">
            <h2>
              {language === "id" ? (
                <>
                  Dirancang & Dikembangkan <br /> oleh <span>{config.developer.fullName}</span>
                </>
              ) : (
                <>
                  Designed and Developed <br /> by <span>{config.developer.fullName}</span>
                </>
              )}
            </h2>
            <h5>
              <MdCopyright /> {new Date().getFullYear()}
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
