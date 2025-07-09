import React from 'react';

interface BonkStrategyLogoProps {
  className?: string;
}

export const BonkStrategyLogo: React.FC<BonkStrategyLogoProps> = ({ className = '' }) => {
  return (
    <svg 
      viewBox="0 0 800 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* B */}
      <path d="M20 80V20H50C65 20 75 28 75 40C75 48 71 54 65 57C73 60 78 68 78 78C78 90 68 80 50 80H20ZM35 48H45C50 48 53 45 53 40C53 35 50 32 45 32H35V48ZM35 68H48C53 68 56 65 56 60C56 55 53 52 48 52H35V68Z" fill="#FF6B35"/>
      
      {/* Sun/Star burst between B and o */}
      <g transform="translate(90, 50)">
        <circle cx="0" cy="0" r="8" fill="#FF6B35"/>
        {/* 8 rays */}
        <path d="M0,-15 L2,-8 L8,-8 L2,-2 L0,5 L-2,-2 L-8,-8 L-2,-8 Z" fill="#FF6B35"/>
        <path d="M0,-15 L2,-8 L8,-8 L2,-2 L0,5 L-2,-2 L-8,-8 L-2,-8 Z" fill="#FF6B35" transform="rotate(45)"/>
        <path d="M0,-15 L2,-8 L8,-8 L2,-2 L0,5 L-2,-2 L-8,-8 L-2,-8 Z" fill="#FF6B35" transform="rotate(90)"/>
        <path d="M0,-15 L2,-8 L8,-8 L2,-2 L0,5 L-2,-2 L-8,-8 L-2,-8 Z" fill="#FF6B35" transform="rotate(135)"/>
        <path d="M0,-15 L2,-8 L8,-8 L2,-2 L0,5 L-2,-2 L-8,-8 L-2,-8 Z" fill="#FF6B35" transform="rotate(180)"/>
        <path d="M0,-15 L2,-8 L8,-8 L2,-2 L0,5 L-2,-2 L-8,-8 L-2,-8 Z" fill="#FF6B35" transform="rotate(225)"/>
        <path d="M0,-15 L2,-8 L8,-8 L2,-2 L0,5 L-2,-2 L-8,-8 L-2,-8 Z" fill="#FF6B35" transform="rotate(270)"/>
        <path d="M0,-15 L2,-8 L8,-8 L2,-2 L0,5 L-2,-2 L-8,-8 L-2,-8 Z" fill="#FF6B35" transform="rotate(315)"/>
      </g>
      
      {/* n */}
      <path d="M115 80V45H130L131 50C134 47 139 44 145 44C155 44 162 51 162 62V80H147V64C147 58 144 55 138 55C132 55 129 58 129 64V80H115Z" fill="#FF6B35"/>
      
      {/* k */}
      <path d="M175 80V20H190V58L210 45H230L205 65L235 80H215L190 68V80H175Z" fill="#FF6B35"/>
      
      {/* S */}
      <path d="M250 80C270 80 285 70 285 55C285 35 250 40 250 30C250 25 255 22 262 22C269 22 274 25 274 30H288C288 18 278 10 262 10C246 10 236 18 236 30C236 50 271 45 271 55C271 60 266 63 259 63C252 63 247 60 247 55H233C233 67 243 80 250 80Z" fill="#FF6B35"/>
      
      {/* t */}
      <path d="M300 80V58H295V45H300V30H315V45H325V58H315V68C315 72 317 74 321 74H325V80H320C305 80 300 75 300 65V80Z" fill="#FF6B35"/>
      
      {/* r */}
      <path d="M340 80V45H355L356 50C359 47 364 44 370 44V58C364 58 355 61 355 68V80H340Z" fill="#FF6B35"/>
      
      {/* a */}
      <path d="M385 80V75C388 78 393 80 400 80C415 80 425 70 425 62C425 54 415 44 400 44C393 44 388 46 385 49V45H370V80H385ZM398 68C391 68 385 63 385 57C385 51 391 46 398 46C405 46 411 51 411 57C411 63 405 68 398 68Z" fill="#FF6B35"/>
      
      {/* t */}
      <path d="M440 80V58H435V45H440V30H455V45H465V58H455V68C455 72 457 74 461 74H465V80H460C445 80 440 75 440 65V80Z" fill="#FF6B35"/>
      
      {/* e */}
      <path d="M480 62C480 54 488 44 500 44C512 44 520 54 520 62V65H495C496 70 499 73 504 73C507 73 510 71 511 68H519C517 75 511 80 500 80C488 80 480 70 480 62ZM495 58H505C504 53 501 50 497 50C493 50 490 53 495 58Z" fill="#FF6B35"/>
      
      {/* g */}
      <path d="M535 90C535 85 538 82 543 81V78C538 76 535 72 535 67C535 62 538 58 543 56V53C538 51 535 46 535 40C535 32 541 26 550 26C555 26 559 28 562 31H575V38H568C569 39 570 41 570 43C570 51 564 57 555 57C553 57 551 57 549 56C548 57 547 59 547 60C547 62 549 63 553 63H563C573 63 580 68 580 77C580 86 572 93 558 93H535ZM550 77C550 80 552 82 556 82H560C564 82 567 80 567 77C567 74 564 72 560 72H553C551 73 550 75 550 77ZM550 48C555 48 558 45 558 40C558 35 555 32 550 32C545 32 542 35 542 40C542 45 545 48 550 48Z" fill="#FF6B35"/>
      
      {/* y */}
      <path d="M595 45H610L625 70L640 45H655L630 90C628 94 624 97 618 97H610V85H615C617 85 619 84 620 82L622 80L595 45Z" fill="#FF6B35"/>
      
      {/* Registered trademark symbol */}
      <circle cx="670" cy="30" r="8" stroke="#FF6B35" strokeWidth="1.5" fill="none"/>
      <path d="M667 27H670C671.5 27 672.5 28 672.5 29.5C672.5 30.5 672 31.2 671 31.5L672.5 33H671L669.5 31.5H668V33H667V27ZM668 30.5H670C670.5 30.5 671 30 671 29.5C671 29 670.5 28.5 670 28.5H668V30.5Z" fill="#FF6B35"/>
    </svg>
  );
};