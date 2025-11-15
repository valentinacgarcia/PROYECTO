<?php

namespace App\Service;

use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

class EmailService
{
    private MailerInterface $mailer;

    public function __construct(MailerInterface $mailer)
    {
        $this->mailer = $mailer;
    }

    public function sendCustomEmail(string $to, string $subject, string $body): void
    {
        $email = (new Email())
            ->from('petmatchnoreply1@gmail.com')
            ->to($to)
            ->subject($subject)
            ->text($body);

        $this->mailer->send($email);
    }

    public function sendAdoptionConfirmationToInterested(string $to, string $name, string $petName): void
    {
        $subject = "Confirmaste la adopción de $petName";
        $body = "¡Hola $name!\n\n"
            . "Se confirmo la adopcion de $petName!!\n\n"
            . "Te pedimos por favor que confirmes mediante el chat cuando recibas a tu mascota! Así se hace efectiva la nueva adopcion!\n\n"
            . "¡Gracias por adoptar responsablemente!\n\n"
            . "El equipo de PETMATCH ❤️";

        $this->sendCustomEmail($to, $subject, $body);
    }

    public function sendAdoptionConfirmationToOwner(string $to, string $name, string $petName, string $interestedName): void
    {
        $subject = "$interestedName confirmó que quiere adoptar a $petName";
        $body = "Hola $name,\n\n"
            . "$interestedName confirmó su intención de adoptar a $petName.\n\n"
            . "Podés ingresar a PETMATCH para revisar la confirmación y decidir los próximos pasos!\n\n"
            . "El equipo de PETMATCH ❤️";

        $this->sendCustomEmail($to, $subject, $body);
    }

    public function sendConfirmationArrival(string $to, string $name, string $petName, string $interestedName): void
    {
        $subject = "$interestedName confirmó que recibió a $petName";
        $body = "Hola $name,\n\n"
            . "$interestedName confirmó que ya recibió a $petName!!\n\n"
            . "¡Podes seguir chateando con $interestedName en PETMATCH, para saber el estado de la mascota!\n\n"
            . "¡Gracias por permitir que tu mascota encuentre un nuevo hogar!\n\n"
            . "El equipo de PETMATCH ❤️";

        $this->sendCustomEmail($to, $subject, $body);
    }
}
