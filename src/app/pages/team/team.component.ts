import { Component } from '@angular/core';

interface TeamMember {
  name: string;
  instagram: string;
  photo: string;
  roleLead: string;
  titles: string[];
}

@Component({
  selector: 'app-team',
  standalone: false,
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css'],
})
export class TeamComponent {

  members: TeamMember[] = [
    {
      name: 'gomidev.developer',
      instagram: 'gomidev.developer',
      photo: '/images/devs/gomidev.developer.webp',
      roleLead: 'Área técnica',
      titles: [
        'Director Ejecutivo (CEO)',
        'Director Técnico (CTO)',
        'Programador Jefe',
        'Arquitecto de Software',
        'Desarrollador Backend Senior',
        'Desarrollador Frontend Senior',
        'Desarrollador Full Stack',
        'Ingeniero de Redes',
        'Ingeniero de WebSockets',
        'Administrador de Bases de Datos',
        'Administrador de Servidores',
        'Ingeniero DevOps',
        'Responsable de Infraestructura en la Nube',
        'Ingeniero de Seguridad Informática',
        'Líder de Control de Versiones',
        'Ingeniero de Rendimiento',
        'Programador de Inteligencia Artificial (los bots)',
        'Diseñador del Motor de Reglas',
        'Responsable de Matchmaking',
        'Ingeniero de QA Automatizado',
        'Cazador de Bugs Oficial',
        'Responsable de Builds y Despliegues',
        'Soporte Técnico Nivel 1, 2 y 3',
        'Redactor de la Documentación Técnica',
        'Traductor de "COSAS A CAMBIAR.txt"',
        'Responsable de que el servidor no se caiga a las 3 AM',
      ],
    },
    {
      name: 'aweonao_crea',
      instagram: 'aweonao_crea',
      photo: '/images/devs/aweonao_crea.webp',
      roleLead: 'Área gráfica',
      titles: [
        'Directora Creativa',
        'Directora de Arte',
        'Diseñadora de Personajes',
        'Ilustradora de Cartas',
        'Artista de Conceptos',
        'Diseñadora de Interfaz (UI/UX)',
        'Pintora de Splash Art',
        'Diseñadora de Iconos',
        'Colorista Jefa',
        'Diseñadora de Mazos',
        'Artista de Fondos y Escenarios',
        'Responsable de Tipografía',
        'Diseñadora del Esqueleto de la Beta',
        'Diseñadora del Logo',
        'Directora de Identidad de Marca',
        'Community Manager Visual',
        'Diseñadora de Redes Sociales',
        'Responsable de Animaciones',
        'Artista de Efectos Visuales',
        'Diseñadora de Empaques (para cuando haya cartas físicas)',
        'Consultora de Estética General',
        'Encargada de que todo se vea bonito',
      ],
    },
  ];

}
