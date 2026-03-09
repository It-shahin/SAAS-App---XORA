import clsx from "clsx";
import Marker from "./Marker";

// Extract Inner to module level - stable identity across renders
const Inner = ({ icon, children, markerfill }) => (
  <>
    <span className="relative flex items-center min-h-[60px] px-4 g4 rounded-2xl inner-before group-hover:before:opacity-100 overflow-hidden">
      <span className="absolute -left-[1px]">
        <Marker markerfill={markerfill} />
      </span>
      {icon && (
        <img 
          src={icon} 
          alt="circle" 
          className="size-10 mr-5 object-contain z-10" 
        />
      )}
      <span className="relative z-2 font-poppins base-bold text-pl uppercase">
        {children}
      </span>
    </span>
    <span className="glow-before glow-after"/>
  </>
);

const Button = ({ icon, children, href, containerClassName, onClick, markerfill }) => {
  return href ? (
    <a href={href} className={clsx("relative p-0.5 rounded-2xl shadow-500 group", containerClassName)}>
      <Inner icon={icon} markerfill={markerfill}>{children}</Inner>
    </a>
  ) : (
    <button 
      className={clsx("relative p-0.5 rounded-2xl shadow-500 group", containerClassName)}
      onClick={onClick}
    >
      <Inner icon={icon} markerfill={markerfill}>{children}</Inner>
    </button>
  );
};

export default Button;
