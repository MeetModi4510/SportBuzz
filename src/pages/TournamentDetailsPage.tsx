import { useParams, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { TournamentManager } from "@/components/admin/TournamentManager";
import { Helmet } from "react-helmet-async";

const TournamentDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const playerName = searchParams.get("player") || undefined;

    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Tournament Details - SportBuzz</title>
            </Helmet>
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <TournamentManager initialTournamentId={id} initialPlayerName={playerName} />
            </main>
        </div>
    );
};

export default TournamentDetailsPage;
