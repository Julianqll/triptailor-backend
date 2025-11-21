import { PrismaClient, ActivityType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Crear ciudad piloto: Cusco
  // Buscar si ya existe una ciudad con ese nombre
  let cusco = await prisma.city.findFirst({
    where: { name: 'Cusco' },
  });

  if (!cusco) {
    cusco = await prisma.city.create({
      data: {
        name: 'Cusco',
        country: 'Perú',
        timezone: 'America/Lima',
        isActive: true,
      },
    });
  }

  console.log('✅ Ciudad creada:', cusco.name);

  // Crear actividades de ejemplo
  const activities = [
    {
      name: 'Visita a Machu Picchu',
      description: 'Tour guiado a la ciudadela inca de Machu Picchu, una de las 7 maravillas del mundo.',
      type: ActivityType.CULTURE,
      tags: ['cultura', 'historia', 'arqueología', 'unesco'],
      approxPrice: 250,
      location: 'Machu Picchu, Aguas Calientes',
      durationMin: 480,
      startTime: '06:00',
      endTime: '18:00',
      cityId: cusco.id,
    },
    {
      name: 'Tour del Valle Sagrado',
      description: 'Recorrido por los principales sitios arqueológicos del Valle Sagrado de los Incas.',
      type: ActivityType.CULTURE,
      tags: ['cultura', 'historia', 'valle sagrado'],
      approxPrice: 80,
      location: 'Valle Sagrado',
      durationMin: 480,
      startTime: '08:00',
      endTime: '18:00',
      cityId: cusco.id,
    },
    {
      name: 'Rafting en el Río Urubamba',
      description: 'Aventura de rafting en aguas bravas del río Urubamba, nivel principiante a intermedio.',
      type: ActivityType.ADVENTURE,
      tags: ['aventura', 'deportes acuáticos', 'naturaleza'],
      approxPrice: 120,
      location: 'Río Urubamba',
      durationMin: 240,
      startTime: '09:00',
      endTime: '15:00',
      cityId: cusco.id,
    },
    {
      name: 'Montañismo al Vinicunca (Montaña Arcoíris)',
      description: 'Trekking de día completo a la famosa Montaña de 7 Colores, a más de 5000 msnm.',
      type: ActivityType.ADVENTURE,
      tags: ['aventura', 'trekking', 'naturaleza', 'montaña'],
      approxPrice: 100,
      location: 'Vinicunca, Cusco',
      durationMin: 600,
      startTime: '03:00',
      endTime: '18:00',
      cityId: cusco.id,
    },
    {
      name: 'Cena en Chicha por Gastón Acurio',
      description: 'Restaurante de alta cocina peruana dirigido por el reconocido chef Gastón Acurio.',
      type: ActivityType.GASTRONOMY,
      tags: ['gastronomía', 'alta cocina', 'peruana', 'restaurante'],
      approxPrice: 80,
      location: 'Plaza Regocijo, Cusco',
      durationMin: 120,
      startTime: '19:00',
      endTime: '22:00',
      cityId: cusco.id,
    },
    {
      name: 'Tour Gastronómico por Mercados Locales',
      description: 'Recorrido por los mercados tradicionales de Cusco, degustando platos típicos y aprendiendo sobre ingredientes locales.',
      type: ActivityType.GASTRONOMY,
      tags: ['gastronomía', 'mercados', 'tradicional', 'cultura'],
      approxPrice: 50,
      location: 'Mercado San Pedro, Cusco',
      durationMin: 180,
      startTime: '10:00',
      endTime: '13:00',
      cityId: cusco.id,
    },
    {
      name: 'Cocina Clase: Aprende a hacer Ceviche',
      description: 'Clase de cocina donde aprenderás a preparar ceviche y otros platos peruanos tradicionales.',
      type: ActivityType.GASTRONOMY,
      tags: ['gastronomía', 'cocina', 'experiencia', 'tradicional'],
      approxPrice: 60,
      location: 'Centro de Cusco',
      durationMin: 180,
      startTime: '11:00',
      endTime: '14:00',
      cityId: cusco.id,
    },
    {
      name: 'Museo de Arte Precolombino',
      description: 'Visita al museo que alberga una impresionante colección de arte precolombino peruano.',
      type: ActivityType.CULTURE,
      tags: ['cultura', 'museo', 'historia', 'arte'],
      approxPrice: 20,
      location: 'Plaza Nazarenas, Cusco',
      durationMin: 120,
      startTime: '09:00',
      endTime: '18:00',
      cityId: cusco.id,
    },
    {
      name: 'Spa y Masajes Andinos',
      description: 'Relajación con masajes tradicionales andinos y tratamientos de spa usando ingredientes locales.',
      type: ActivityType.RELAX,
      tags: ['relax', 'spa', 'bienestar', 'masajes'],
      approxPrice: 70,
      location: 'Centro de Cusco',
      durationMin: 90,
      startTime: '10:00',
      endTime: '20:00',
      cityId: cusco.id,
    },
    {
      name: 'Noche en Discotecas de Cusco',
      description: 'Tour por los mejores bares y discotecas de Cusco, con música en vivo y ambiente festivo.',
      type: ActivityType.NIGHTLIFE,
      tags: ['noche', 'discoteca', 'bares', 'música'],
      approxPrice: 40,
      location: 'Centro de Cusco',
      durationMin: 240,
      startTime: '22:00',
      endTime: '02:00',
      cityId: cusco.id,
    },
    {
      name: 'Cicloturismo por la Ciudad',
      description: 'Recorrido en bicicleta por los principales puntos históricos y miradores de Cusco.',
      type: ActivityType.ADVENTURE,
      tags: ['aventura', 'bicicleta', 'ciudad', 'ejercicio'],
      approxPrice: 45,
      location: 'Centro de Cusco',
      durationMin: 180,
      startTime: '09:00',
      endTime: '15:00',
      cityId: cusco.id,
    },
    {
      name: 'Mirador de Cristo Blanco',
      description: 'Visita al mirador de Cristo Blanco para disfrutar de una vista panorámica de Cusco al atardecer.',
      type: ActivityType.RELAX,
      tags: ['relax', 'mirador', 'vistas', 'fotografía'],
      approxPrice: 10,
      location: 'Sacsayhuamán, Cusco',
      durationMin: 60,
      startTime: '17:00',
      endTime: '19:00',
      cityId: cusco.id,
    },
  ];

  for (const activity of activities) {
    const existingActivity = await prisma.activity.findFirst({
      where: {
        name: activity.name,
        cityId: cusco.id,
      },
    });

    if (!existingActivity) {
      await prisma.activity.create({
        data: activity,
      });
    }
  }

  console.log(`✅ ${activities.length} actividades creadas`);

  // Crear usuario de ejemplo (opcional)
  const hashedPassword = await bcrypt.hash('password123', 10);
  const exampleUser = await prisma.user.upsert({
    where: { email: 'demo@triptailor.com' },
    update: {},
    create: {
      name: 'Usuario Demo',
      email: 'demo@triptailor.com',
      passwordHash: hashedPassword,
    },
  });

  console.log('✅ Usuario demo creado:', exampleUser.email);
  console.log('📝 Credenciales: demo@triptailor.com / password123');

  console.log('✨ Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

