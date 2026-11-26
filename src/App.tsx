
import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowUpRight, Plus, Search, Shield, Swords,
  Users, Zap, X, Trophy, Target
} from "lucide-react";
import { supabase } from "./lib/supabase";
import { attributes, overall, type Player } from "./types";

const empty = {
  name: "",
  position: "Atacante",
  speed: 50,
  finishing: 50,
  passing: 50,
  dribbling: 50,
  defense: 50,
  control: 50
};

const labels: Record<string, string> = {
  speed: "Velocidade",
  finishing: "Finalização",
  passing: "Passe",
  dribbling: "Drible",
  defense: "Defesa",
  control: "Controle"
};

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [active, setActive] = useState("Dashboard");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(empty);
  const [teamName, setTeamName] = useState("");
  const [teamMembers, setTeamMembers] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("Conecte seu Supabase para salvar seus dados.");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  async function load() {
    if (!supabase) return;

    const { data: p, error: pe } = await supabase
      .from("players")
      .select("*")
      .order("created_at", { ascending: false });

    if (pe) {
      setMessage(pe.message);
      return;
    }

    const { data: t } = await supabase
      .from("teams")
      .select("*, team_players(player_id)");

    const loadedPlayers = (p ?? []) as Player[];

    setPlayers(loadedPlayers);

    setSelectedPlayer(current =>
      current
        ? loadedPlayers.find(player => player.id === current.id) ?? null
        : null
    );

    setTeams(t ?? []);

    setTeamMembers(
      Object.fromEntries(
        (t ?? []).map((team: any) => [
          team.id,
          (team.team_players ?? []).map((x: any) => x.player_id)
        ])
      )
    );

    setMessage("Banco de dados conectado.");
  }

  useEffect(() => {
    void load();
  }, []);

  async function addPlayer(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase) {
      setMessage("Configure o arquivo .env para conectar o Supabase.");
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      xp: 0,
      level: 1,
      skill_points: 0,
      awakened: false
    };

    const { error } = await supabase.from("players").insert(payload);

    if (error) {
      setMessage(error.message);
      return;
    }

    setForm(empty);
    setShowForm(false);
    await load();
  }

  async function createTeam(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase || !teamName.trim()) return;

    const { error } = await supabase
      .from("teams")
      .insert({ name: teamName.trim() });

    if (error) {
      setMessage(error.message);
      return;
    }

    setTeamName("");
    await load();
  }

  async function toggleMember(teamId: string, playerId: string) {
    if (!supabase) return;

    const exists = (teamMembers[teamId] ?? []).includes(playerId);

    const result = exists
      ? await supabase.from("team_players").delete()
          .eq("team_id", teamId).eq("player_id", playerId)
      : await supabase.from("team_players").insert({
          team_id: teamId,
          player_id: playerId
        });

    if (result.error) setMessage(result.error.message);
    else await load();
  }

  async function deletePlayer(id: string) {
    if (!supabase || !confirm("Excluir este jogador?")) return;

    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
    } else {
      if (selectedPlayer?.id === id) setSelectedPlayer(null);
      await load();
    }
  }

  async function awardXp(player: Player) {
    if (!supabase) return;

    let xp = (player.xp ?? 0) + 25;
    let level = player.level ?? 1;
    let skillPoints = player.skill_points ?? 0;

    while (xp >= 100) {
      xp -= 100;
      level += 1;
      skillPoints += 3;
    }

    const { error } = await supabase
      .from("players")
      .update({
        xp,
        level,
        skill_points: skillPoints
      })
      .eq("id", player.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await load();
  }

  async function upgradeAttribute(
    player: Player,
    attribute: typeof attributes[number]
  ) {
    if (!supabase || (player.skill_points ?? 0) <= 0) return;
    if (player[attribute] >= 100) return;

    const { error } = await supabase
      .from("players")
      .update({
        [attribute]: player[attribute] + 1,
        skill_points: player.skill_points - 1
      })
      .eq("id", player.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await load();
  }

  async function awakenPlayer(player: Player) {
    if (!supabase || (player.level ?? 1) < 10 || player.awakened) return;

    const { error } = await supabase
      .from("players")
      .update({ awakened: true })
      .eq("id", player.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await load();
  }

  const ranked = useMemo(
    () => [...players].sort((a, b) => overall(b) - overall(a)),
    [players]
  );

  const filtered = players.filter(
    p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.position.toLowerCase().includes(query.toLowerCase())
  );

  const selectedRank = selectedPlayer
    ? ranked.findIndex(p => p.id === selectedPlayer.id) + 1
    : 0;

  const selectedTeams = selectedPlayer
    ? teams.filter(team =>
        (teamMembers[team.id] ?? []).includes(selectedPlayer.id)
      )
    : [];

  const nav = ["Dashboard", "Jogadores", "Times", "Ranking"];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Zap size={22} /></div>
          <div><b>EGOIST</b><span>SYSTEM</span></div>
        </div>

        <div className="side-label">MENU PRINCIPAL</div>

        {nav.map((n, i) => (
          <button
            key={n}
            className={`nav-item ${active === n ? "selected" : ""}`}
            onClick={() => {
              setActive(n);
              setSelectedPlayer(null);
            }}
          >
            {i === 0 ? <Activity /> : i === 1 ? <Users /> : i === 2 ? <Shield /> : <Swords />}
            {n}
          </button>
        ))}

        <div className="side-bottom">
          <div className="status-dot" /> {message}
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">BLUE LOCK PROJECT / PLAYER MANAGEMENT</div>
            <h1>{selectedPlayer ? "Perfil do jogador" : active}</h1>
          </div>
          <div className="top-tag">EGO MODE <span>● ONLINE</span></div>
        </header>

        {selectedPlayer ? (
          <section className="player-profile">
            <div className="profile-top">
              <button className="back-button" onClick={() => setSelectedPlayer(null)}>
                <X size={16} /> Fechar perfil
              </button>
              <span className="eyebrow">EGOIST SYSTEM / PLAYER DATA</span>
            </div>

            <div className="profile-hero">
              <div className="profile-identity">
                <div className="profile-avatar">
                  <Zap size={46} />
                </div>
                <div>
                  <span className="eyebrow">PLAYER PROFILE</span>
                  <h2>{selectedPlayer.name}</h2>
                  <span className="profile-position">{selectedPlayer.position}</span>
                  {selectedPlayer.awakened && (
                    <span className="awakened-tag">✦ EGO DESPERTADO</span>
                  )}
                </div>
              </div>

              <div className="profile-overall">
                <span>OVERALL</span>
                <strong>{overall(selectedPlayer)}</strong>
                <small>PLAYER RATING</small>
              </div>
            </div>

            <div className="profile-summary">
              <div className="profile-info-card">
                <Trophy size={20} />
                <span>POSIÇÃO NO RANKING</span>
                <strong>#{selectedRank || "—"}</strong>
              </div>

              <div className="profile-info-card">
                <Shield size={20} />
                <span>TIMES</span>
                <strong>{selectedTeams.length}</strong>
              </div>

              <div className="profile-info-card">
                <Target size={20} />
                <span>ATRIBUTOS</span>
                <strong>06</strong>
              </div>
            </div>

            <div className="profile-progression">
              <div className="profile-section-title">
                <div>
                  <span className="eyebrow">EGO DEVELOPMENT</span>
                  <h3>EVOLUÇÃO DO JOGADOR</h3>
                </div>
                <strong className="level-display">
                  LV. {selectedPlayer.level ?? 1}
                </strong>
              </div>

              <div className="xp-info">
                <span>EXPERIÊNCIA</span>
                <strong>{selectedPlayer.xp ?? 0} / 100 XP</strong>
              </div>

              <div className="xp-track">
                <div
                  className="xp-fill"
                  style={{ width: `${selectedPlayer.xp ?? 0}%` }}
                />
              </div>

              <div className="evolution-footer">
                <span>
                  <Zap size={16} />
                  {selectedPlayer.skill_points ?? 0} pontos disponíveis
                </span>

                <button
                  className="primary"
                  onClick={() => void awardXp(selectedPlayer)}
                >
                  +25 XP
                </button>
              </div>

              <div className="awakening-area">
                {selectedPlayer.awakened ? (
                  <div className="awakened-status">
                    <Zap size={20} />
                    <strong>EGO DESPERTADO</strong>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="eyebrow">EGO AWAKENING</span>
                      <p>
                        {(selectedPlayer.level ?? 1) >= 10
                          ? "Seu jogador atingiu o nível necessário."
                          : `Desbloqueio no nível 10. Faltam ${10 - (selectedPlayer.level ?? 1)} níveis.`}
                      </p>
                    </div>

                    <button
                      className="awaken-button"
                      disabled={(selectedPlayer.level ?? 1) < 10}
                      onClick={() => void awakenPlayer(selectedPlayer)}
                    >
                      DESPERTAR
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="profile-attributes">
              <div className="profile-section-title">
                <div>
                  <span className="eyebrow">PLAYER ANALYSIS</span>
                  <h3>ATRIBUTOS DO JOGADOR</h3>
                </div>
                <span className="attribute-count">0 — 100</span>
              </div>

              {attributes.map(a => (
                <div className="attribute-row" key={a}>
                  <div className="attribute-label">
                    <span>{labels[a]}</span>
                    <strong>{selectedPlayer[a]}</strong>
                  </div>

                  <div className="attribute-track">
                    <div
                      className="attribute-fill"
                      style={{ width: `${selectedPlayer[a]}%` }}
                    />
                  </div>

                  <button
                    className="upgrade-button"
                    disabled={
                      (selectedPlayer.skill_points ?? 0) <= 0 ||
                      selectedPlayer[a] >= 100
                    }
                    onClick={() => void upgradeAttribute(selectedPlayer, a)}
                    title="Gastar 1 ponto neste atributo"
                  >
                    +1
                  </button>
                </div>
              ))}
            </div>

            <div className="profile-team">
              <div>
                <span className="eyebrow">CURRENT AFFILIATION</span>
                <h3>TIME ATUAL</h3>
              </div>

              {selectedTeams.length ? (
                <div className="profile-team-list">
                  {selectedTeams.map(team => (
                    <div className="profile-team-item" key={team.id}>
                      <Shield size={18} />
                      <strong>{team.name}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Este jogador ainda não pertence a nenhum time.</p>
              )}
            </div>
          </section>
        ) : (
          <>
            {active === "Dashboard" && (
              <section>
                <div className="hero">
                  <div>
                    <div className="eyebrow">A REVOLUÇÃO COMEÇA AQUI</div>
                    <h2>DESPERTE SEU<br /><em>EGO.</em></h2>
                    <p>Construa seu elenco. Domine o campo. Torne-se o melhor.</p>
                    <button
                      className="primary"
                      onClick={() => {
                        setActive("Jogadores");
                        setShowForm(true);
                      }}
                    >
                      <Plus size={17} /> Cadastrar jogador
                    </button>
                  </div>

                  <div className="hero-emblem">
  <img
    src="https://bluelock-anime-en.com/wp-content/themes/anime/assets/images/logo.svg"
    alt="BLUE LOCK"
  />
</div>
                </div>

                <div className="stats-grid">
                  <Stat icon={<Users />} label="JOGADORES" value={players.length} />
                  <Stat icon={<Shield />} label="TIMES" value={teams.length} />
                  <Stat icon={<Swords />} label="MAIOR OVERALL" value={ranked[0] ? overall(ranked[0]) : "—"} />
                  <Stat
                    icon={<Activity />}
                    label="MÉDIA DO ELENCO"
                    value={players.length
                      ? Math.round(players.reduce((s, p) => s + overall(p), 0) / players.length)
                      : "—"}
                  />
                </div>

                <div className="panel">
                  <div className="panel-head">
                    <h3>TOP EGOÍSTAS</h3>
                    <button className="text-btn" onClick={() => setActive("Ranking")}>
                      Ver ranking <ArrowUpRight size={15} />
                    </button>
                  </div>
                  <Ranking rows={ranked.slice(0, 5)} onSelect={setSelectedPlayer} />
                </div>
              </section>
            )}

            {active === "Jogadores" && (
              <section className="panel">
                <div className="panel-head">
                  <h3>GERENCIAR JOGADORES</h3>
                  <button className="primary" onClick={() => setShowForm(!showForm)}>
                    <Plus size={16} /> Novo jogador
                  </button>
                </div>

                <div className="search">
                  <Search size={17} />
                  <input
                    placeholder="Buscar por nome ou posição..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />
                </div>

                {showForm && (
                  <form className="player-form" onSubmit={addPlayer}>
                    <label>
                      Nome
                      <input
                        required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                      />
                    </label>

                    <label>
                      Posição
                      <select
                        value={form.position}
                        onChange={e => setForm({ ...form, position: e.target.value })}
                      >
                        {["Atacante", "Ponta", "Meio-campo", "Volante", "Zagueiro", "Lateral", "Goleiro"].map(x => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </label>

                    {attributes.map(a => (
                      <label key={a}>
                        {labels[a]}: {form[a]}
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={form[a]}
                          onChange={e => setForm({ ...form, [a]: Number(e.target.value) })}
                        />
                      </label>
                    ))}

                    <button className="primary" type="submit">Salvar jogador</button>
                  </form>
                )}

                <Ranking
                  rows={filtered.sort((a, b) => overall(b) - overall(a))}
                  onDelete={deletePlayer}
                  onSelect={setSelectedPlayer}
                />
              </section>
            )}

            {active === "Times" && (
              <section className="panel">
                <div className="panel-head"><h3>MEUS TIMES</h3></div>

                <form className="team-create" onSubmit={createTeam}>
                  <input
                    placeholder="Nome do novo time"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                  />
                  <button className="primary">
                    <Plus size={16} /> Criar time
                  </button>
                </form>

                {teams.map(team => (
                  <div className="team-card" key={team.id}>
                    <h3>{team.name}</h3>
                    <p>{(teamMembers[team.id] ?? []).length} jogador(es)</p>
                    <div className="member-list">
                      {players.map(p => (
                        <label key={p.id}>
                          <input
                            type="checkbox"
                            checked={(teamMembers[team.id] ?? []).includes(p.id)}
                            onChange={() => void toggleMember(team.id, p.id)}
                          />
                          {p.name} <small>{p.position}</small>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                {!teams.length && <p className="empty">Nenhum time criado ainda.</p>}
              </section>
            )}

            {active === "Ranking" && (
              <section className="panel">
                <div className="panel-head">
                  <h3>RANKING GERAL</h3>
                  <span className="eyebrow">ORDENADO POR OVERALL</span>
                </div>
                <Ranking rows={ranked} onSelect={setSelectedPlayer} />
              </section>
            )}
          </>
        )}

        <footer>EGOIST SYSTEM <span>— PROVE YOUR WORTH.</span></footer>
      </main>
    </div>
  );
}

function Stat({ icon, label, value }: any) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <strong>{value}</strong>
    </div>
  );
}

function Ranking({
  rows,
  onDelete,
  onSelect
}: {
  rows: Player[];
  onDelete?: (id: string) => void;
  onSelect?: (player: Player) => void;
}) {
  return (
    <div className="ranking">
      {rows.map((p, i) => (
        <div
          className={`rank-row ${onSelect ? "clickable-row" : ""}`}
          key={p.id}
          onClick={() => onSelect?.(p)}
          onKeyDown={e => {
            if (onSelect && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              onSelect(p);
            }
          }}
          role={onSelect ? "button" : undefined}
          tabIndex={onSelect ? 0 : undefined}
        >
          <div className="rank-number">{String(i + 1).padStart(2, "0")}</div>

          <div className="player-info">
            <b>{p.name}</b>
            <span>{p.position}</span>
          </div>

          <div className="mini-bars">
            {attributes.map(a => (
              <div key={a} title={`${a}: ${p[a]}`}>
                <i style={{ width: `${p[a]}%` }} />
              </div>
            ))}
          </div>

          <div className="overall">
            <small>OVR</small>
            <b>{overall(p)}</b>
          </div>

          {onDelete && (
            <button
              className="delete"
              onClick={e => {
                e.stopPropagation();
                onDelete(p.id);
              }}
            >
              Excluir
            </button>
          )}
        </div>
      ))}

      {!rows.length && <p className="empty">Nenhum jogador cadastrado.</p>}
    </div>
  );
}
