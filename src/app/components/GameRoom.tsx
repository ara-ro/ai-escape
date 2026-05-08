import { useState } from 'react';
import { motion } from 'motion/react';
import { Maximize2, Search } from 'lucide-react';

interface InteractiveObject {
  id: string;
  name: string;
  x: number;
  y: number;
  size: number;
  discovered: boolean;
}

export default function GameRoom() {
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);

  const objects: InteractiveObject[] = [
    { id: 'door', name: '잠긴 문', x: 50, y: 30, size: 80, discovered: false },
    { id: 'table', name: '낡은 테이블', x: 25, y: 55, size: 60, discovered: false },
    { id: 'cabinet', name: '약장', x: 75, y: 50, size: 65, discovered: false },
    { id: 'clock', name: '멈춘 시계', x: 50, y: 15, size: 40, discovered: true },
  ];

  const handleObjectClick = (object: InteractiveObject) => {
    console.log('Investigating:', object.name);
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1701988571136-a48405491706?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwaG9zcGl0YWwlMjByb29tJTIwZXNjYXBlJTIwZ2FtZSUyMG15c3Rlcnl8ZW58MXx8fHwxNzc4MjUxODgwfDA&ixlib=rb-4.1.0&q=80&w=1080)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      </div>

      {/* Vignette Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.7)_100%)] pointer-events-none" />

      {/* Interactive Objects */}
      <div className="absolute inset-0">
        {objects.map((object) => (
          <motion.div
            key={object.id}
            className="absolute cursor-pointer group"
            style={{
              left: `${object.x}%`,
              top: `${object.y}%`,
              width: `${object.size}px`,
              height: `${object.size}px`,
              transform: 'translate(-50%, -50%)',
            }}
            onHoverStart={() => setHoveredObject(object.id)}
            onHoverEnd={() => setHoveredObject(null)}
            onClick={() => handleObjectClick(object)}
            whileHover={{ scale: 1.05 }}
            animate={{
              opacity: hoveredObject === object.id ? 1 : 0.8,
            }}
          >
            {/* Glow Effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-cyan-400/30 blur-xl"
              animate={{
                opacity: hoveredObject === object.id ? 0.8 : 0,
                scale: hoveredObject === object.id ? 1.2 : 1,
              }}
              transition={{ duration: 0.3 }}
            />

            {/* Pulse Animation for Undiscovered */}
            {!object.discovered && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-yellow-400/60"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}

            {/* Object Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {hoveredObject === object.id ? (
                  <Maximize2 className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                ) : (
                  <Search className="w-6 h-6 text-cyan-300/60 group-hover:text-cyan-400" />
                )}
              </div>
            </div>

            {/* Object Label */}
            <motion.div
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap"
              initial={{ opacity: 0, y: -5 }}
              animate={{
                opacity: hoveredObject === object.id ? 1 : 0,
                y: hoveredObject === object.id ? 0 : -5,
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-black/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-cyan-400/30">
                <span className="text-cyan-300 text-sm font-medium drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                  {object.name}
                </span>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Room Title */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] tracking-wider">
            폐쇄된 병동 - 3층 복도
          </h2>
          <p className="text-cyan-400 text-sm mt-1 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]">
            공간을 조사하여 탈출 방법을 찾으세요
          </p>
        </motion.div>
      </div>
    </div>
  );
}
