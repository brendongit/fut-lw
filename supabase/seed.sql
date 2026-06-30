-- Seed: 30 fictional players
-- Run AFTER creating a user and replacing USER_ID with their UUID
-- Example: select auth.uid(); to get your user id after login

-- Replace 'YOUR_USER_ID_HERE' with your actual user UUID
do $$
declare
  uid uuid := auth.uid(); -- Use logged-in user
begin

insert into players (owner_id, name, phone, wins) values
  (uid, 'Carlos Silva', '(11) 99111-0001', 3),
  (uid, 'Roberto Alves', '(11) 99111-0002', 7),
  (uid, 'Marcos Souza', NULL, 1),
  (uid, 'Felipe Santos', '(11) 99111-0004', 5),
  (uid, 'Anderson Lima', '(11) 99111-0005', 2),
  (uid, 'Diego Ferreira', NULL, 9),
  (uid, 'Gustavo Pereira', '(11) 99111-0007', 4),
  (uid, 'Rafael Costa', '(11) 99111-0008', 6),
  (uid, 'Lucas Martins', NULL, 0),
  (uid, 'Thiago Oliveira', '(11) 99111-0010', 11),
  (uid, 'Eduardo Rocha', '(11) 99111-0011', 2),
  (uid, 'Henrique Dias', NULL, 8),
  (uid, 'Mateus Barbosa', '(11) 99111-0013', 3),
  (uid, 'Pedro Nascimento', '(11) 99111-0014', 1),
  (uid, 'Leandro Carvalho', NULL, 5),
  (uid, 'Bruno Ribeiro', '(11) 99111-0016', 7),
  (uid, 'Rodrigo Mendes', '(11) 99111-0017', 4),
  (uid, 'Alexandre Gomes', NULL, 2),
  (uid, 'Vitor Sousa', '(11) 99111-0019', 6),
  (uid, 'Caio Araujo', '(11) 99111-0020', 3),
  (uid, 'Igor Cavalcanti', NULL, 0),
  (uid, 'Murilo Pinto', '(11) 99111-0022', 5),
  (uid, 'Davi Cardoso', '(11) 99111-0023', 1),
  (uid, 'Samuel Teixeira', NULL, 8),
  (uid, 'Nathan Correia', '(11) 99111-0025', 2),
  (uid, 'Gabriel Monteiro', '(11) 99111-0026', 10),
  (uid, 'Arthur Vieira', NULL, 4),
  (uid, 'Kaique Nunes', '(11) 99111-0028', 3),
  (uid, 'Wesley Farias', '(11) 99111-0029', 6),
  (uid, 'Renato Moreira', NULL, 1);

end $$;
